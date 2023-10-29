import Trade from '../../models/tradeModel.js';
import Card from '../../models/cardModel.js';
import Collection from '../../models/collectionModel.js';
import Profile from '../../models/profileModel.js';
import Transaction from '../../models/transactionModel.js';
import { v4 } from 'uuid';
import Hero from '../../models/heroModel.js';
import { validateBalance, validateHerosOwnership } from './validateTrade.js';

const openTrade = async (trade, user) => {
	const tradeId = v4();
	let metadata = await getMetaData(trade);
	metadata = [...metadata, user.username.toLowerCase()];
	const newTrade = new Trade({
		trade_id: tradeId,
		trade_owner: {
			user_id: user.user_id,
			username: user.username
		},
		metadata,
		...trade
	});

	const tradeSave = await newTrade.save();

	if (!tradeSave) return false;
	return newTrade.trade_id;
};

export const updateInSaleCardStatus = async (cardIds, user, toSale, session) => {
	let updateInSaleStatus;
	updateInSaleStatus = await Card.updateMany(
		{
			card_id: { $in: cardIds }
		},
		{
			$set: {
				in_sale: toSale ? true : false,
				'card_owner.user_id': user.user_id,
				'card_owner.username': user.username
			}
		},
		{ session }
	);

	if (!updateInSaleStatus) return false;
	return true;
};

export const newTrade = async (trade, user) => {
	if (!trade.give_gems) {
		const updateInSaleStatus = await updateInSaleCardStatus(trade.give, user, true);
		if (!updateInSaleStatus) return false;
	}

	const tradeId = await openTrade(trade, user);
	if (!tradeId) return false;

	return tradeId;
};

export const closeTrade = async (trade_id, user_id, username, session) => {
	const trade = await Trade.findOne({ trade_id });

	const tradeDelte = await Trade.deleteOne({ trade_id }, { session });
	if (!tradeDelte) return false;

	const transaction_id = v4();
	const newTransaction = new Transaction({
		transaction_id,
		trade_id: trade.trade_id,
		give: trade.give,
		give_gems: trade.give_gems,
		take: trade.take,
		take_gems: trade.take_gems,
		'trade_owner.user_id': trade.trade_owner.user_id,
		'trade_owner.username': trade.trade_owner.username,
		'trade_accepter.user_id': user_id,
		'trade_accepter.username': username
	});

	const transactionSave = await newTransaction.save({ session });
	if (!transactionSave) {
		// const tradeReset = new Trade({ ...trade });
		// await tradeReset.save();
		return false;
	}

	return true;
};

export const updateProfileGems = async (executor, tradeOwner, trade, session) => {
	let tradeOwnerUpdateObject = {};

	if (trade.give_gems) {
		tradeOwnerUpdateObject = {
			gems_held: tradeOwner.gems_held - trade.give
		};
	} else {
		tradeOwnerUpdateObject = {
			gems_available: tradeOwner.gems_available + trade.take
		};
	}

	return {
		updateExecutorProfile: await Profile.updateOne(
			{ profile_id: executor.user_id },
			{
				gems_available: trade.give_gems
					? executor.gems_available + trade.give
					: executor.gems_available - trade.take
			},
			{ session }
		),
		updateTradeOwnerProfile: await Profile.updateOne(
			{ profile_id: trade.trade_owner.user_id },
			tradeOwnerUpdateObject,
			{ session }
		)
	};
};

export const updateCollectionCards = async (
	executor,
	tradeOwner,
	updatedExecutorCards,
	updatedTradeOwnerCards,
	trade,
	cards,
	session
) => {
	return {
		updateExecutorCollection: await Collection.updateOne(
			{ collection_id: executor.user_id },
			{
				cards: updatedExecutorCards,
				legendary_cards: executor.legendary_cards + cards.legendary_cards,
				epic_cards: executor.epic_cards + cards.epic_cards,
				rare_cards: executor.rare_cards + cards.rare_cards
			},
			{ session }
		),
		updateTradeOwnerCollection: await Collection.updateOne(
			{ collection_id: trade.trade_owner.user_id },
			{
				cards: updatedTradeOwnerCards,
				legendary_cards: tradeOwner.legendary_cards - cards.legendary_cards,
				epic_cards: tradeOwner.epic_cards - cards.epic_cards,
				rare_cards: tradeOwner.rare_cards - cards.rare_cards
			},
			{ session }
		)
	};
};

export const getAmountOfRarities = async (Ids) => {
	return {
		legendaryCards: await Card.countDocuments({
			rarity: 'Legendary',
			card_id: { $in: Ids }
		}),
		epicCards: await Card.countDocuments({
			rarity: 'Epic',
			card_id: { $in: Ids }
		}),
		rareCards: await Card.countDocuments({
			rarity: 'Rare',
			card_id: { $in: Ids }
		})
	};
};

export const getRarityAmountDiff = (executorCards, tradeOwnerCards) => {
	return {
		legendary_cards_diff: tradeOwnerCards.legendary_cards - executorCards.legendary_cards,
		epic_cards_diff: tradeOwnerCards.epic_cards - executorCards.epic_cards,
		rare_cards_diff: tradeOwnerCards.rare_cards - executorCards.rare_cards
	};
};

export const getUserCardsFromHeroIds = async (heroIds, userId) => {
	const cardIdCounts = {}; // Object to keep track of card counts for each hero ID
	const cardIds = []; // Array to collect card IDs

	for (const heroId of heroIds) {
		// Initialize count for this hero ID if not already done
		cardIdCounts[heroId] = cardIdCounts[heroId] || { count: 0, limit: 0 };
		cardIdCounts[heroId].limit++; // Increment the limit for this hero ID

		// If the count of fetched cards for this hero ID is less than the specified limit,
		// fetch the next card for this hero ID and increment the count
		if (cardIdCounts[heroId].count < cardIdCounts[heroId].limit) {
			const card = await Card.findOne({
				'card_owner.user_id': userId,
				hero_id: heroId,
				// Ensure the card hasn't already been added to cardIds
				card_id: { $nin: cardIds }
			}).select('card_id');

			if (card) {
				cardIds.push(card.card_id);
				cardIdCounts[heroId].count++;
			}
		}
	}

	return cardIds;
};

export const updateHeldGemsBalance = async (user_id, trade, tradeAction) => {
	const userProfile = await Profile.findOne({ profile_id: user_id });

	const profileUpdated = await Profile.updateOne(
		{ profile_id: user_id },
		{
			gems_held:
				tradeAction === 'open'
					? userProfile.gems_held + trade.give
					: userProfile.gems_held - trade.give,
			gems_available:
				tradeAction === 'open'
					? userProfile.gems_available - trade.give
					: userProfile.gems_available + trade.give
		}
	);

	if (!profileUpdated) return false;
	return true;
};

const getMetaData = async (trade) => {
	let metaData = [];

	if (Array.isArray(trade.give)) {
		const giveCards = await Card.find({ card_id: { $in: trade.give } });

		const giveMetaData = giveCards.reduce((acc, card) => {
			acc.push(card.rarity.toLowerCase(), card.role.toLowerCase(), card.name.toLowerCase());
			return acc;
		}, []);

		metaData = [...metaData, ...giveMetaData];
	}
	if (Array.isArray(trade.take)) {
		const takeHeros = await Hero.find({ hero_id: { $in: trade.take } });

		const takeMetaData = takeHeros.reduce((acc, hero) => {
			acc.push(hero.rarity, hero.role, hero.name);
			return acc;
		}, []);

		metaData = [...metaData, ...takeMetaData];
	}

	return metaData;
};

export const openDefaultTrade = async (cardIds, session) => {
	const mainAccProfile = await Profile.findOne({ username: process.env.MAIN_ACC_NAME });
	const populatedCards = await Card.find({ card_id: { $in: cardIds } });

	await updateInSaleCardStatus(
		cardIds,
		{
			user_id: mainAccProfile.profile_id,
			username: mainAccProfile.username
		},
		true,
		session
	);

	for (const card of populatedCards) {
		let cardCost = 0;
		switch (card.rarity) {
			case 'Legendary':
				cardCost = 2500;
				break;
			case 'Epic':
				cardCost = 1000;
				break;
			case 'Rare':
				cardCost = 400;
		}

		const tradeId = v4();

		const trade = {
			give: [card.card_id],
			give_gems: false,
			take: cardCost,
			take_gems: true,
			trade_owner: {
				user_id: mainAccProfile.profile_id,
				username: mainAccProfile.username
			},
			trade_accepter: {
				user_id: null,
				username: null
			}
		};

		let metadata = await getMetaData(trade);
		metadata = [...metadata, mainAccProfile.username.toLowerCase()];

		const newTrade = new Trade({
			trade_id: tradeId,
			metadata,
			...trade
		});

		const tradeSave = await newTrade.save({ session });
		if (!tradeSave) return false;
	}

	return true;
};

export const tradeExecutionOperations = async (req, session) => {
	const { user_id, username } = req.user;
	const { trade_id } = req.params;

	const trade = await Trade.findOne({ trade_id });

	if (!trade) return { status: 'fail', message: 'No trade found.', code: 404 };
	if (trade.trade_owner.user_id === user_id)
		return { status: 'fail', message: "You can't execute your own trades.", code: 403 };

	if (trade.trade_accepter.user_id !== null && user_id !== trade.trade_accepter.user_id)
		return { status: 'fail', message: "You can't execute this trade.", code: 401 };

	const executorProfile = await Profile.findOne({ profile_id: user_id });
	if (!executorProfile) return { status: 'fail', message: "Can't find your profile.", code: 404 };

	if (
		trade.trade_accepter.user_id !== null &&
		executorProfile.favourite_trades.includes(trade.trade_id)
	) {
		await Profile.updateOne(
			{ profile_id: user_id },
			{ $pull: { favourite_trades: trade.trade_id } },
			{ session }
		);
	}

	const executorCollection = await Collection.findOne({ collection_id: user_id });
	if (!executorCollection)
		return { status: 'fail', message: "Can't find your collection.", code: 404 };

	const tradeOwnerCollection = await Collection.findOne({
		collection_id: trade.trade_owner.user_id
	});
	if (!tradeOwnerCollection)
		return { status: 'fail', message: "Can't find your collection.", code: 404 };

	if (!trade.take_gems) {
		const heroOwnershipValid = await validateHerosOwnership(user_id, trade.take);
		if (!heroOwnershipValid)
			return {
				status: 'fail',
				message: "You don't have needed heros or some of them are in sale.",
				code: 400
			};

		if (trade.give_gems) {
			// Code to withdraw cards from executor to trade owner
			// and gems from trade owner to executor

			const tradeOwnerProfile = await Profile.findOne({ profile_id: trade.trade_owner.user_id });
			if (!tradeOwnerProfile)
				return { status: 'fail', message: 'No trade owner profile found.', code: 404 };

			const chosenCardIds = await getUserCardsFromHeroIds(trade.take, user_id);

			const updatedExecutorCards = executorCollection.cards.filter(
				(cardId) => !chosenCardIds.includes(cardId)
			);

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
				trade,
				session
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
				},
				session
			);

			const updateCardsInfo = await updateInSaleCardStatus(
				chosenCardIds,
				trade.trade_owner,
				false,
				session
			);

			const tradeClosed = await closeTrade(trade_id, user_id, username, session);

			if (
				!tradeClosed ||
				!updateCardsInfo ||
				!updateTradeOwnerCollection ||
				!updateExecutorCollection ||
				!updateTradeOwnerProfile ||
				!updateExecutorProfile
			) {
				return { status: 'fail', message: 'Trade failed.', code: 500 };
			}
		} else {
			// Code to withdraw cards from executor from take field
			// and cards from trade owner from give field
			const chosenCardIds = await getUserCardsFromHeroIds(trade.take, user_id);

			// Exclude cards that trade owner takes from executor
			let updatedExecutorCards = executorCollection.cards.filter(
				(cardId) => !chosenCardIds.includes(cardId)
			);

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
				},
				session
			);

			const updateGivenCardsInfo = await updateInSaleCardStatus(
				trade.give,
				req.user,
				false,
				session
			);
			const updateTakenCardsInfo = await updateInSaleCardStatus(
				chosenCardIds,
				trade.trade_owner,
				false,
				session
			);

			const tradeClosed = await closeTrade(trade_id, user_id, username, session);

			if (
				!tradeClosed ||
				!updateGivenCardsInfo ||
				!updateTakenCardsInfo ||
				!updateTradeOwnerCollection ||
				!updateExecutorCollection
			) {
				return { status: 'fail', message: 'Trade failed.', code: 500 };
			}
		}
	} else if (trade.take_gems) {
		const enoughGems = await validateBalance(user_id, trade.take);
		if (!enoughGems) return { status: 'fail', message: "You don't have enough gems.", code: 400 };

		// Code to withdraw cards from trade owner from give field
		// and withdraw gems from executor to trade owner

		const executorProfile = await Profile.findOne({ profile_id: user_id });
		if (!executorProfile) return { status: 'fail', message: "Can't find your profile.", code: 404 };

		const tradeOwnerProfile = await Profile.findOne({ profile_id: trade.trade_owner.user_id });
		if (!tradeOwnerProfile)
			return { status: 'fail', message: 'No trade owner profile found.', code: 404 };

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
			trade,
			session
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
			},
			session
		);

		const updateCardsInfo = await updateInSaleCardStatus(trade.give, req.user, false, session);

		const tradeClosed = await closeTrade(trade_id, user_id, username, session);

		if (
			!tradeClosed ||
			!updateCardsInfo ||
			!updateTradeOwnerCollection ||
			!updateExecutorCollection ||
			!updateTradeOwnerProfile ||
			!updateExecutorProfile
		) {
			return { status: 'fail', message: 'Trade failed.', code: 500 };
		}
	}

	return { status: 'success' };
};
