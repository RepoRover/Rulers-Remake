import catchAsync from '../helpers/catchAsync.js';
import Trade from './../models/tradeModel.js';
import APIError from '../helpers/APIError.js';
import {
	validateCards,
	validateBalance,
	validateHeros,
	validateSaleStatus,
	validateHerosOwnership
} from '../helpers/validateTrade.js';
import { newTrade } from '../helpers/trade_helpers/tradeFunctions.js';
import Profile from '../models/profileModel.js';
import Collection from '../models/collectionModel.js';
import Card from '../models/cardModel.js';

const closeTrade = async (trade_id, user_id, username) => {
	return await Trade.updateOne(
		{ trade_id },
		{
			'trade_accepter.user_id': user_id,
			'trade_accepter.username': username,
			trade_status: 'closed'
		}
	);
};

const updateProfiles = async (executor, tradeOwner, trade) => {
	return {
		updateExecutorProfile: await Profile.updateOne(
			{ profile_id: executor.user_id },
			{ gems: executor.gems - trade.take }
		),
		updateTradeOwnerProfile: await Profile.updateOne(
			{ profile_id: trade.trade_owner.user_id },
			{ gems: tradeOwner.gems + trade.take }
		)
	};
};

const updateCollections = async (
	executor,
	tradeOwner,
	updatedExecutorCards,
	updatedTradeOwnerCards,
	trade,
	cards
) => {
	return {
		updateExecutorCollection: await Collection.updateOne(
			{ collection_id: executor.user_id },
			{
				cards: updatedExecutorCards,
				legendary_cards: executor.legendary_cards + cards.legendary_cards,
				epic_cards: executor.epic_cards + cards.epic_cards,
				rare_cards: executor.rare_cards + cards.rare_cards
			}
		),
		updateTradeOwnerCollection: await Collection.updateOne(
			{ collection_id: trade.trade_owner.user_id },
			{
				cards: updatedTradeOwnerCards,
				legendary_cards: tradeOwner.legendary_cards - cards.legendary_cards,
				epic_cards: tradeOwner.epic_cards - cards.epic_cards,
				rare_cards: tradeOwner.rare_cards - cards.rare_cards
			}
		)
	};
};

const getAmountOfRarities = async (cardIds) => {
	return {
		legendaryCards: await Card.countDocuments({
			rarity: 'Legendary',
			card_id: { $in: cardIds }
		}),
		epicCards: await Card.countDocuments({
			rarity: 'Epic',
			card_id: { $in: cardIds }
		}),
		rareCards: await Card.countDocuments({
			rarity: 'Rare',
			card_id: { $in: cardIds }
		})
	};
};

const getRarityAmountDiff = (executorCards, tradeOwnerCards) => {
	return {
		legendary_cards_diff: tradeOwnerCards.legendary_cards - executorCards.legendary_cards,
		epic_cards_diff: tradeOwnerCards.epic_cards - executorCards.epic_cards,
		rare_cards_diff: tradeOwnerCards.rare_cards - executorCards.rare_cards
	};
};

export const getAllTrades = catchAsync(async (req, res, next) => {});

export const postNewTrade = catchAsync(async (req, res, next) => {
	const { trade } = req.body;
	const { user_id } = req.user;

	if (
		!(Array.isArray(trade.give) || typeof trade.give === 'number') ||
		!(Array.isArray(trade.take) || typeof trade.take === 'number') ||
		(Array.isArray(trade.give) && trade.give_gems) ||
		(Array.isArray(trade.take) && trade.take_gems) ||
		(trade.give_gems && trade.take_gems) ||
		(typeof trade.give === 'number' && typeof trade.take === 'number') ||
		typeof trade.give_gems !== 'boolean' ||
		typeof trade.take_gems !== 'boolean'
	) {
		return next(new APIError('Invalid trade info.', 400));
	}

	if (!trade.give_gems) {
		const ownershipValid = await validateCards(user_id, trade.give);
		if (!ownershipValid) return next(new APIError("You don't have cards you want to give.", 400));

		const cardsAreNotInSale = await validateSaleStatus(trade.give, 'open');
		if (!cardsAreNotInSale) return next(new APIError('Card/-s are already in sale.', 400));
	} else if (trade.give_gems) {
		const enoughGems = await validateBalance(user_id, trade.give);
		if (!enoughGems) return next(new APIError("You don't have enough gems.", 400));
	}

	if (!trade.take_gems) {
		const validHeroes = await validateHeros(trade.take);
		if (!validHeroes) return next(new APIError('You want to take invalid hero/-s', 400));
	}

	const tradeId = await newTrade(trade, req.user);

	if (!tradeId) return next(new APIError("Couldn't publish your trade", 500));

	res.status(200).json({ status: 'success', trade_id: tradeId });
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
		if (!heroOwnershipValid) return next(new APIError("You don't have needed heros.", 400));

		if (trade.give_gems) {
			// Code to withdraw cards from executor to trade owner
			// and gems from trade owner to executor
		} else {
			// Code to withdraw cards from executor from take field
			// and cards from trade owner from give field
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

		const { updateExecutorProfile, updateTradeOwnerProfile } = await updateProfiles(
			{ user_id, gems: executorProfile.gems },
			{ gems: tradeOwnerProfile.gems },
			trade
		);

		const { updateExecutorCollection, updateTradeOwnerCollection } = await updateCollections(
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

		const updateCardsStatus = await Card.updateMany(
			{ card_id: { $in: trade.give } },
			{ in_sale: false, 'card_owner.user_id': user_id, 'card_owner.username': username }
		);

		const tradeClosed = await closeTrade(trade_id, user_id, username);

		if (
			!tradeClosed ||
			!updateCardsStatus ||
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

			return next(new APIError('Trade failed.', 500));
		}
	}

	res.status(200).json({ status: 'success' });
});

export const deleteTrade = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;
	const { trade_id } = req.params;
});
