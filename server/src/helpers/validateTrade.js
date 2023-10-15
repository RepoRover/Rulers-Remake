import Collection from '../models/collectionModel';
import Profile from '../models/profileModel';
import Hero from '../models/heroModel';

export const validateCards = async (tradeOwnerId, cardIdArray) => {
	const { cards } = await Collection.findOne({ user_id: tradeOwnerId });

	for (const cardId of cardIdArray) {
		if (!cards.includes(cardId)) {
			return false;
		}
	}
	return true;
};

export const validateBalance = async (tradeOwnerId, gemAmount) => {
	const { gems } = await Profile.findOne({ user_id: tradeOwnerId });
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
