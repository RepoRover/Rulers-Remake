import Trade from '../../models/tradeModel.js';
import Card from '../../models/cardModel.js';
import Collection from '../../models/collectionModel.js';
import Profile from '../../models/profileModel.js';
import Transaction from '../../models/transactionModel.js';
import { v4 } from 'uuid';
import Hero from '../../models/heroModel.js';

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

export const updateInSaleCardStatus = async (cardIds, tradeAction, user, backToSale) => {
	let updateInSaleStatus;
	// console.log(cardIds);
	if (tradeAction === 'open') {
		updateInSaleStatus = await Card.updateMany(
			{ card_id: { $in: cardIds } },
			{ $set: { in_sale: true } }
		);
	} else if (tradeAction === 'close') {
		updateInSaleStatus = await Card.updateMany(
			{
				card_id: { $in: cardIds }
			},
			{
				$set: {
					in_sale: backToSale ? true : false,
					'card_owner.user_id': user.user_id,
					'card_owner.username': user.username
				}
			}
		);
	}

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
	const trade = await Trade.findOne({ trade_id });

	const tradeDelte = await Trade.deleteOne({ trade_id });
	if (!tradeDelte) return false;

	const newTransaction = new Transaction({
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

	const transactionSave = await newTransaction.save();
	if (!transactionSave) {
		const tradeReset = new Trade({ ...trade });
		await tradeReset.save();
		return false;
	}

	return true;
};

export const updateProfileGems = async (executor, tradeOwner, trade) => {
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
			}
		),
		updateTradeOwnerProfile: await Profile.updateOne(
			{ profile_id: trade.trade_owner.user_id },
			tradeOwnerUpdateObject
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
