import catchAsync from '../helpers/catchAsync.js';
import Trade from './../models/tradeModel.js';
import APIError from '../helpers/APIError.js';
import {
	validateCards,
	validateBalance,
	validateHeros,
	validateSaleStatus,
	validateHerosOwnership
} from '../helpers/trade_helpers/validateTrade.js';
import {
	newTrade,
	closeTrade,
	updateProfileGems,
	updateCollectionCards,
	getAmountOfRarities,
	getRarityAmountDiff,
	updateInSaleCardStatus,
	getUserCardsFromHeroIds,
	updateHeldGemsBalance
} from '../helpers/trade_helpers/tradeFunctions.js';
import Profile from '../models/profileModel.js';
import Collection from '../models/collectionModel.js';

export const getAllTrades = catchAsync(async (req, res, next) => {});

export const postNewTrade = catchAsync(async (req, res, next) => {
	const { trade } = req.body;
	const { user_id } = req.user;

	if (!trade.take_gems) {
		const validHeroes = await validateHeros(trade.take);
		if (!validHeroes) return next(new APIError('You want to take invalid hero/-s', 400));
	}

	if (!trade.give_gems) {
		const ownershipValid = await validateCards(user_id, trade.give);
		if (!ownershipValid) return next(new APIError("You don't have cards you want to give.", 400));

		const cardsAreNotInSale = await validateSaleStatus(trade.give, 'open');
		if (!cardsAreNotInSale) return next(new APIError('Card/-s already in sale.', 400));
	} else if (trade.give_gems) {
		const enoughGems = await validateBalance(user_id, trade.give);
		if (!enoughGems) return next(new APIError("You don't have enough gems.", 400));

		const userProfile = await Profile.findOne({ profile_id: user_id });

		const updateHoldGems = await Profile.updateOne(
			{ profile_id: user_id },
			{
				gems_available: userProfile.gems_available - trade.give,
				gems_held: userProfile.gems_held + trade.give
			}
		);

		if (!updateHoldGems) return next(new APIError("Couldn't publish your trade.", 500));
	}

	const tradeId = await newTrade(trade, req.user);

	if (!tradeId) return next(new APIError("Couldn't publish your trade.", 500));

	res.status(201).json({ status: 'success', trade_id: tradeId });
});

export const executeTrade = catchAsync(async (req, res, next) => {
	const { user_id, username } = req.user;
	const { trade_id } = req.params;

	const trade = await Trade.findOne({ trade_id });

	if (!trade) return next(new APIError('No trade found.', 404));
	if (trade.trade_owner.user_id === user_id)
		return next(new APIError("You can't execute your own trades.", 403));

	const executorCollection = await Collection.findOne({ collection_id: user_id });
	if (!executorCollection) return next(new APIError("Can't find your collection.", 404));

	const tradeOwnerCollection = await Collection.findOne({
		collection_id: trade.trade_owner.user_id
	});
	if (!tradeOwnerCollection) return next(new APIError("Can't find your collection.", 404));

	if (!trade.take_gems) {
		const heroOwnershipValid = await validateHerosOwnership(user_id, trade.take);
		if (!heroOwnershipValid)
			return next(new APIError("You don't have needed heros or some of them are in sale.", 400));

		if (trade.give_gems) {
			// Code to withdraw cards from executor to trade owner
			// and gems from trade owner to executor
			const executorProfile = await Profile.findOne({ profile_id: user_id });
			if (!executorProfile) return next(new APIError("Can't find your profile.", 404));

			const tradeOwnerProfile = await Profile.findOne({ profile_id: trade.trade_owner.user_id });
			if (!tradeOwnerProfile) return next(new APIError('No trade owner profile found.', 404));

			const chosenCardIds = await getUserCardsFromHeroIds(trade.take, user_id);

			const updatedExecutorCards = executorCollection.cards.filter((cardId) => {
				!chosenCardIds.includes(cardId);
			});

			const updatedTradeOwnerCards = [...chosenCardIds, ...tradeOwnerCollection.cards];

			const { legendaryCards, epicCards, rareCards } = await getAmountOfRarities(chosenCardIds);

			const { legendary_cards_diff, epic_cards_diff, rare_cards_diff } = getRarityAmountDiff(
				{
					legendary_cards: legendaryCards,
					epic_cards: epicCards,
					rare_cards: rareCards
				},
				{
					legendary_cards: 0,
					epic_cards: 0,
					rare_cards: 0
				}
			);

			const { updateExecutorProfile, updateTradeOwnerProfile } = await updateProfileGems(
				{ user_id, gems_available: executorProfile.gems_available },
				{
					gems_available: tradeOwnerProfile.gems_available,
					gems_held: tradeOwnerProfile.gems_held
				},
				trade
			);

			const { updateExecutorCollection, updateTradeOwnerCollection } = await updateCollectionCards(
				{
					user_id,
					legendary_cards: executorCollection.legendary_cards,
					epic_cards: executorCollection.epic_cards,
					rare_cards: executorCollection.rare_cards
				},
				{
					legendary_cards: tradeOwnerCollection.legendary_cards,
					epic_cards: tradeOwnerCollection.epic_cards,
					rare_cards: tradeOwnerCollection.rare_cards
				},
				updatedExecutorCards,
				updatedTradeOwnerCards,
				trade,
				{
					legendary_cards: legendary_cards_diff,
					epic_cards: epic_cards_diff,
					rare_cards: rare_cards_diff
				}
			);

			const updateCardsInfo = await updateInSaleCardStatus(
				chosenCardIds,
				'close',
				trade.trade_owner,
				false
			);

			const tradeClosed = await closeTrade(trade_id, user_id, username);

			if (
				!tradeClosed ||
				!updateCardsInfo ||
				!updateTradeOwnerCollection ||
				!updateExecutorCollection ||
				!updateTradeOwnerProfile ||
				!updateExecutorProfile
			) {
				// Reset executor profile and collection
				await Profile.updateOne({ profile_id: user_id }, { ...executorProfile });
				await Collection.updateOne({ collection_id: user_id }, { ...executorCollection });

				// Reset trade owner profile and collection
				await Profile.updateOne(
					{ profile_id: trade.trade_owner.user_id },
					{ ...tradeOwnerProfile }
				);
				await Collection.updateOne(
					{ collection_id: trade.trade_owner.user_id },
					{ ...tradeOwnerCollection }
				);

				await updateInSaleCardStatus(chosenCardIds, 'close', req.user, false);

				return next(new APIError('Trade failed.', 500));
			}
		} else {
			// Code to withdraw cards from executor from take field
			// and cards from trade owner from give field
			const chosenCardIds = await getUserCardsFromHeroIds(trade.take, user_id);

			// Exclude cards that trade owner takes from executor
			let updatedExecutorCards = executorCollection.cards.filter((cardId) => {
				!chosenCardIds.includes(cardId);
			});

			// Add cards trade owner gives in the trade
			updatedExecutorCards = [...trade.give, ...updatedExecutorCards];

			let updatedTradeOwnerCards = tradeOwnerCollection.cards.filter(
				(cardId) => !trade.give.includes(cardId)
			);

			updatedTradeOwnerCards = [...chosenCardIds, ...updatedTradeOwnerCards];

			const tradeOwnerAmountOfRarities = await getAmountOfRarities(trade.give);
			const executorAmountOfRarities = await getAmountOfRarities(chosenCardIds);

			const { legendary_cards_diff, epic_cards_diff, rare_cards_diff } = getRarityAmountDiff(
				{
					legendary_cards: executorAmountOfRarities.legendaryCards,
					epic_cards: executorAmountOfRarities.epicCards,
					rare_cards: executorAmountOfRarities.rareCards
				},
				{
					legendary_cards: tradeOwnerAmountOfRarities.legendaryCards,
					epic_cards: tradeOwnerAmountOfRarities.epicCards,
					rare_cards: tradeOwnerAmountOfRarities.rareCards
				}
			);

			const { updateExecutorCollection, updateTradeOwnerCollection } = await updateCollectionCards(
				{
					user_id,
					legendary_cards: executorCollection.legendary_cards,
					epic_cards: executorCollection.epic_cards,
					rare_cards: executorCollection.rare_cards
				},
				{
					legendary_cards: tradeOwnerCollection.legendary_cards,
					epic_cards: tradeOwnerCollection.epic_cards,
					rare_cards: tradeOwnerCollection.rare_cards
				},
				updatedExecutorCards,
				updatedTradeOwnerCards,
				trade,
				{
					legendary_cards: legendary_cards_diff,
					epic_cards: epic_cards_diff,
					rare_cards: rare_cards_diff
				}
			);

			const updateGivenCardsInfo = await updateInSaleCardStatus(
				trade.give,
				'close',
				req.user,
				false
			);
			const updateTakenCardsInfo = await updateInSaleCardStatus(
				chosenCardIds,
				'close',
				trade.trade_owner,
				false
			);

			const tradeClosed = await closeTrade(trade_id, user_id, username);

			if (
				!tradeClosed ||
				!updateGivenCardsInfo ||
				!updateTakenCardsInfo ||
				!updateTradeOwnerCollection ||
				!updateExecutorCollection
			) {
				// Reset executor profile and collection
				await Collection.updateOne({ collection_id: user_id }, { ...executorCollection });

				// Reset trade owner profile and collection
				await Collection.updateOne(
					{ collection_id: trade.trade_owner.user_id },
					{ ...tradeOwnerCollection }
				);

				await updateInSaleCardStatus(trade.give, 'close', trade.trade_owner, true);
				await updateInSaleCardStatus(chosenCardIds, 'close', req.user, false);

				return next(new APIError('Trade failed.', 500));
			}
		}
	} else if (trade.take_gems) {
		const enoughGems = await validateBalance(user_id, trade.take);
		if (!enoughGems) return next(new APIError("You don't have enough gems.", 400));

		// Code to withdraw cards from trade owner from give field
		// and withdraw gems from executor to trade owner

		const executorProfile = await Profile.findOne({ profile_id: user_id });
		if (!executorProfile) return next(new APIError("Can't find your profile.", 404));

		const tradeOwnerProfile = await Profile.findOne({ profile_id: trade.trade_owner.user_id });
		if (!tradeOwnerProfile) return next(new APIError('No trade owner profile found.', 404));

		const updatedTradeOwnerCards = tradeOwnerCollection.cards.filter(
			(card_id) => !trade.give.includes(card_id)
		);

		const updatedExecutorCards = [...trade.give, ...executorCollection.cards];

		const { legendaryCards, epicCards, rareCards } = await getAmountOfRarities(trade.give);
		const { legendary_cards_diff, epic_cards_diff, rare_cards_diff } = getRarityAmountDiff(
			{
				legendary_cards: 0,
				epic_cards: 0,
				rare_cards: 0
			},
			{
				legendary_cards: legendaryCards,
				epic_cards: epicCards,
				rare_cards: rareCards
			}
		);

		const { updateExecutorProfile, updateTradeOwnerProfile } = await updateProfileGems(
			{ user_id, gems_available: executorProfile.gems_available },
			{ gems_available: tradeOwnerProfile.gems_available, gems_held: tradeOwnerProfile.gems_held },
			trade
		);

		const { updateExecutorCollection, updateTradeOwnerCollection } = await updateCollectionCards(
			{
				user_id,
				legendary_cards: executorCollection.legendary_cards,
				epic_cards: executorCollection.epic_cards,
				rare_cards: executorCollection.rare_cards
			},
			{
				legendary_cards: tradeOwnerCollection.legendary_cards,
				epic_cards: tradeOwnerCollection.epic_cards,
				rare_cards: tradeOwnerCollection.rare_cards
			},
			updatedExecutorCards,
			updatedTradeOwnerCards,
			trade,
			{
				legendary_cards: legendary_cards_diff,
				epic_cards: epic_cards_diff,
				rare_cards: rare_cards_diff
			}
		);

		const updateCardsInfo = await updateInSaleCardStatus(trade.give, 'close', req.user, false);

		const tradeClosed = await closeTrade(trade_id, user_id, username);

		if (
			!tradeClosed ||
			!updateCardsInfo ||
			!updateTradeOwnerCollection ||
			!updateExecutorCollection ||
			!updateTradeOwnerProfile ||
			!updateExecutorProfile
		) {
			// Reset executor profile and collection
			await Profile.updateOne({ profile_id: user_id }, { ...executorProfile });
			await Collection.updateOne({ collection_id: user_id }, { ...executorCollection });

			// Reset trade owner profile and collection
			await Profile.updateOne({ profile_id: trade.trade_owner.user_id }, { ...tradeOwnerProfile });
			await Collection.updateOne(
				{ collection_id: trade.trade_owner.user_id },
				{ ...tradeOwnerCollection }
			);

			await updateInSaleCardStatus(trade.give, 'close', trade.trade_owner, true);

			return next(new APIError('Trade failed.', 500));
		}
	}

	res.status(201).json({ status: 'success' });
});

export const deleteTrade = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;
	const { trade_id } = req.params;

	const trade = await Trade.findOne({ trade_id });
	if (!trade) return next(new APIError('No trade found.', 404));

	if (trade.trade_owner.user_id !== user_id)
		return next(new APIError("You can't delete this trade.", 401));

	let cardInSaleStatusUpdated = null;
	let heldBalanceUpdated = null;
	if (!trade.give_gems) {
		cardInSaleStatusUpdated = await updateInSaleCardStatus(trade.give, 'close', req.user, false);
	} else {
		heldBalanceUpdated = await updateHeldGemsBalance(user_id, trade, 'close');
	}

	const tradeDeleted = await Trade.deleteOne({ trade_id });

	if (!tradeDeleted || (!cardInSaleStatusUpdated && !heldBalanceUpdated)) {
		if (!cardInSaleStatusUpdated && !trade.give_gems) {
			await updateInSaleCardStatus(trade.give, 'open');
		} else if (!heldBalanceUpdated && trade.give_gems) {
			await updateHeldGemsBalance(user_id, trade, 'open');
		}
		return next(new APIError("Couldn't delete your trade.", 500));
	}

	res.status(200).json({ status: 'success' });
});
