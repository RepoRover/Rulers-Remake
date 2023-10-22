import Collection from '../../models/collectionModel.js';
import Profile from '../../models/profileModel.js';
import Hero from '../../models/heroModel.js';
import Card from '../../models/cardModel.js';
import APIError from '../APIError.js';

export const validateCards = async (traderId, cardIdArray) => {
	const { cards } = await Collection.findOne({ collection_id: traderId });

	for (const cardId of cardIdArray) {
		if (!cards.includes(cardId)) {
			return false;
		}
	}
	return true;
};

export const validateBalance = async (traderId, gemAmount) => {
	const { gems_available } = await Profile.findOne({ profile_id: traderId });
	if (gems_available < gemAmount) {
		return false;
	}
	return true;
};

export const validateHeros = async (heroIdArray) => {
	const heros = await Hero.find();
	const heroIds = heros.map((hero) => hero.hero_id);

	for (const heroId of heroIdArray) {
		if (!heroIds.includes(heroId)) {
			return false;
		}
	}
	return true;
};

export const validateSaleStatus = async (cardIdsArray, tradeAction) => {
	const cards = await Card.find({ card_id: { $in: cardIdsArray } });
	const cardsInSale = cards.map((card) => card.in_sale);

	if (tradeAction === 'open' && cardsInSale.includes(true)) {
		return false;
	} else if (tradeAction === 'close' && cardsInSale.includes(false)) {
		return false;
	}
	return true;
};

export const validateHerosOwnership = async (traderId, heroIds) => {
	// Create an object to keep track of the required count of each hero type
	const heroCountsRequired = heroIds.reduce((acc, heroId) => {
		acc[heroId] = (acc[heroId] || 0) + 1;
		return acc;
	}, {});

	const heroCountsOwned = {}; // Object to keep track of the owned count of each hero type

	for (const heroId in heroCountsRequired) {
		// Fetch the count of cards of the current hero type owned by the trader
		const count = await Card.countDocuments({
			'card_owner.user_id': traderId,
			hero_id: heroId,
			in_sale: false
		});
		heroCountsOwned[heroId] = count;
	}

	// Compare the required and owned counts of each hero type
	for (const heroId in heroCountsRequired) {
		if (heroCountsRequired[heroId] > heroCountsOwned[heroId]) {
			return false; // Return false if the owned count is less than the required count for any hero type
		}
	}

	return true; // Return true if the owned count meets or exceeds the required count for all hero types
};

export const validateTrade = (req, res, next) => {
	const { give, give_gems, take, take_gems } = req.body.trade;

	if (
		(give_gems && take_gems) ||
		(typeof give === 'number' && typeof take === 'number') ||
		(Array.isArray(give) && give_gems !== false) ||
		(typeof give === 'number' && give_gems !== true) ||
		(Array.isArray(give) && typeof take !== 'number' && !Array.isArray(take)) ||
		(typeof give === 'number' && !Array.isArray(take)) ||
		typeof take_gems !== 'boolean'
	) {
		return next(new APIError('Invalid trade info.', 400));
	}

	next();
};
