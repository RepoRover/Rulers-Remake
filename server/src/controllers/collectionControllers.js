import APIError from '../helpers/APIError';
import catchAsync from '../helpers/catchAsync';
import Collection from '../models/collectionModel';
import Card from '../models/cardModel';
import Profile from '../models/profileModel';
import jwt from 'jsonwebtoken';
import { generateLinks } from '../helpers/linkGenerator';

export const getAllCollections = catchAsync(async (req, res, next) => {
	const { page = 1, favourites, most_cards, username_search } = req.query;

	const itemsPerPage = 36;
	const skip = (page - 1) * itemsPerPage;

	const filters = {};

	if (favourites) {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) {
			return next(new APIError('No token provided to see favourites.', 400));
		}
		const decoded = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET);

		if (!decoded.user_id) {
			return next(new APIError('Invalid token.', 403));
		}

		const { favourite_collections } = await Profile.findOne({ profile_id: decoded.user_id });

		filters.collection_id = { $in: favourite_collections };
	}

	let sort = {};
	if (most_cards) {
		switch (most_cards) {
			case 'legendary':
				sort.legendary_cards = -1;
				break;
			case 'epic':
				sort.epic_cards = -1;
				break;
			case 'rare':
				sort.rare_cards = -1;
				break;
			default:
				return next(new APIError('Invalid mostCards value.', 400));
		}
	}

	if (username_search) {
		filters.username = username_search;
	}

	const collections = await Collection.find(filters)
		.select('-cards')
		.sort(sort)
		.skip(skip)
		.limit(itemsPerPage);

	const totalCollections = await Collection.countDocuments(filters);

	const links = generateLinks(req.baseUrl, req.url, page, totalCollections);

	res.status(200).json({ collections, links });
});

export const getWholeUserCollection = catchAsync(async (req, res, next) => {
	const { username } = req.params;

	const collection = await Collection.findOne({ username });

	if (!collection) return next(new APIError('No collection found.', 404));

	const cardIds = collection.cards;

	const cards = await Card.find({ card_id: { $in: cardIds } });

	res.status(200).json({ status: 'success', collection: { ...collection._doc, cards } });
});
