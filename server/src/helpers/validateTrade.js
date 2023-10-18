import Collection from '../models/collectionModel.js';
import Profile from '../models/profileModel.js';
import Hero from '../models/heroModel.js';
import Card from '../models/cardModel.js';

export const validateCards = async (tradeOwnerId, cardIdArray) => {
	const { cards } = await Collection.findOne({ collection_id: tradeOwnerId });

	for (const cardId of cardIdArray) {
		if (!cards.includes(cardId)) {
			return false;
		}
	}
	return true;
};

export const validateBalance = async (tradeOwnerId, gemAmount) => {
	const { gems } = await Profile.findOne({ profile_id: tradeOwnerId });
	if (gems < gemAmount) {
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
