import APIError from '../helpers/APIError';
import catchAsync from '../helpers/catchAsync';
import Collection from '../models/collectionModel';
import Card from '../models/cardModel';
import Hero from '../models/heroModel';
// import { getAll } from './../helpers/handlerFactory';

export const getAllCollections = catchAsync(async (req, res, next) => {
	const page = req.query.page;
	const limit = 24;
	const skip = (page - 1) * limit;

	const collections = await Collection.find().skip(skip).limit(limit);

	res.status(200).json({ status: 'success', results: collections.length, collections });
});

export const getUserCollection = catchAsync(async (req, res, next) => {
	const { username } = req.params;

	const collection = await Collection.findOne({ username });
	if (!collection) return next(new APIError('No collection found.', 404));

	let cards = [];

	for (const cardId of collection.cards) {
		const card = await Card.findOne({ card_id: cardId });
		cards.push(card);
	}

	let heroRarity = [];

	for (const card of cards) {
		const hero = await Hero.findOne({ hero_id: card.hero_id });
		heroRarity.push(hero.rarity);
	}

	const coll = cards.map((card, index) => {
		return {
			card_id: card.card_id,
			rarity: heroRarity[index]
		};
	});

	res.status(200).json({ status: 'success', coll });
});
