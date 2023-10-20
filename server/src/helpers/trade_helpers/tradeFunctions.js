import Trade from '../../models/tradeModel.js';
import Card from '../../models/cardModel.js';
import Collection from '../../models/collectionModel.js';
import Profile from '../../models/profileModel.js';
import Hero from '../../models/heroModel.js';
import { v4 } from 'uuid';

const openTrade = async (trade, user) => {
	const tradeId = v4();
	const newTrade = new Trade({
		trade_id: tradeId,
		trade_status: 'open',
		trade_owner: {
			user_id: user.user_id,
			username: user.username
		},
		trade_accepter: {
			user_id: null,
			username: null
		},
		...trade
	});

	const tradeSave = await newTrade.save();

	if (!tradeSave) return false;
	return newTrade.trade_id;
};

export const updateInSaleCardStatus = async (cardIdsArray, tradeAction, user) => {
	const updateInSaleStatus = await Card.updateMany(
		{ card_id: { $in: cardIdsArray } },
		tradeAction === 'open'
			? { $set: { in_sale: true } }
			: {
					$set: {
						in_sale: false,
						'card_owner.user_id': user.user_id,
						'card_owner.username': user.username
					}
			  }
	);
	if (!updateInSaleStatus) return false;
	return true;
};

export const newTrade = async (trade, user) => {
	let updateInSaleStatus;
	if (!trade.give_gems) {
		updateInSaleStatus = await updateInSaleCardStatus(trade.give, 'open');
	} else if (trade.give_gems) {
		updateInSaleStatus = await updateInSaleCardStatus(trade.take, 'open');
	}
	if (!updateInSaleStatus) return false;

	const tradeId = await openTrade(trade, user);
	if (!tradeId) return false;

	return tradeId;
};

export const closeTrade = async (trade_id, user_id, username) => {
	return await Trade.updateOne(
		{ trade_id },
		{
			'trade_accepter.user_id': user_id,
			'trade_accepter.username': username,
			trade_status: 'closed'
		}
	);
};

export const updateProfileGems = async (executor, tradeOwner, trade) => {
	return {
		updateExecutorProfile: await Profile.updateOne(
			{ profile_id: executor.user_id },
			{ gems: trade.give_gems ? executor.gems + trade.give : executor.gems - trade.take }
		),
		updateTradeOwnerProfile: await Profile.updateOne(
			{ profile_id: trade.trade_owner.user_id },
			{ gems: trade.give_gems ? tradeOwner.gems - trade.give : tradeOwner.gems + trade.take }
		)
	};
};

export const updateCollectionCards = async (
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
