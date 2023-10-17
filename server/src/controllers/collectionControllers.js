import APIError from '../helpers/APIError';
import catchAsync from '../helpers/catchAsync';
import Collection from '../models/collectionModel';
import Card from '../models/cardModel';
// import Hero from '../models/heroModel';
import Profile from '../models/profileModel';
import jwt from 'jsonwebtoken';

// const mostCardsFilterOptions = ['Legendary', 'Epic', 'Rare'];

export const getAllCollections = catchAsync(async (req, res, next) => {
	const { page = 1, favorites, mostCards } = req.query;

	const ITEMS_PER_PAGE = 36;
	const skip = (page - 1) * ITEMS_PER_PAGE;

	const filters = {};

	if (favorites) {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) {
			return next(new APIError('No token provided to see favorites.', 400));
		}
		const decoded = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET);

		if (!decoded.user_id) {
			return next(new APIError('Invalid token.', 403));
		}

		const { favorite_collections } = await Profile.findOne({ user_id: decoded.user_id });

		filters.collection_id = { $in: favorite_collections };
	}

	// res.status(200).json({ collections: collectionsWithCounts });
});

export const getWholeUserCollection = catchAsync(async (req, res, next) => {
	const { username } = req.params;

	const collection = await Collection.findOne({ username });

	if (!collection) return next(new APIError('No collection found.', 404));

	const cardIds = collection.cards;

	const cards = await Card.find({ card_id: { $in: cardIds } });

	res.status(200).json({ status: 'success', collection: { ...collection._doc, cards } });
});
