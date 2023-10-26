import APIError from '../helpers/APIError.js';
import catchAsync from '../helpers/catchAsync.js';
import Collection from '../models/collectionModel.js';
import Card from '../models/cardModel.js';
import Profile from '../models/profileModel.js';
import jwt from 'jsonwebtoken';
import { generateLinks } from '../helpers/linkGenerator.js';
import { favouriteItem } from '../helpers/itemFavourite.js';

export const getAllCollections = catchAsync(async (req, res, next) => {
	const { page = 1, favourites, most_cards, username_search } = req.query;

	const skip = (page - 1) * process.env.ITEMS_PER_PAGE;

	const filters = {};

	if (favourites) {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) {
			return next(new APIError('No token provided to see favourites.', 400));
		}
		const decoded = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET);

		if (!decoded) {
			return next(new APIError('Invalid token.', 403));
		}

		const profile = await Profile.findOne({ profile_id: decoded.user_id });
		if (!profile) return next(new APIError('No user found.', 404));

		filters.collection_id = { $in: profile.favourite_collections };
	}

	let sort = {};
	if (most_cards) {
		const most_cards_formatted = most_cards.toLowerCase();
		switch (most_cards_formatted) {
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
		.limit(process.env.ITEMS_PER_PAGE);

	const totalCollections = await Collection.countDocuments(filters);

	const links = generateLinks(req.baseUrl, req.url, page, totalCollections);

	res.status(200).json({ status: 'success', collections, links });
});

export const getUserCollection = catchAsync(async (req, res, next) => {
	const { username } = req.params;
	const { page = 1, rarity, role, favourites } = req.query;

	const skip = (page - 1) * process.env.ITEMS_PER_PAGE;

	const roleMapping = {
		support: 'Support',
		tank: 'Tank',
		burst_dealer: 'Burst Dealer'
	};

	const rarityMapping = {
		legendary: 'Legendary',
		epic: 'Epic',
		rare: 'Rare'
	};

	let filters = {};
	if (role) {
		const formattedRole = roleMapping[role.toLowerCase()];
		filters.role = formattedRole;
	}

	if (rarity) {
		const rarity_formatted = rarityMapping[rarity.toLowerCase()];
		filters.rarity = rarity_formatted;
	}

	if (favourites) {
		const token = req.headers.authorization.split(' ')[1];
		if (!token) {
			return next(new APIError('No token provided to see favourites.', 400));
		}
		const decoded = jwt.decode(token, process.env.ACCESS_TOKEN_SECRET);

		if (!decoded.user_id) {
			return next(new APIError('Invalid token.', 403));
		}

		const { favourite_cards } = await Profile.findOne({ profile_id: decoded.user_id });

		filters.card_id = { $in: favourite_cards };
	}

	const collectionDoc = await Collection.findOne({ username });
	if (!collectionDoc) {
		return next(new APIError('No collection found.', 404));
	}

	filters = { 'card_owner.username': username, ...filters };

	const cards = await Card.find(filters).skip(skip).limit(process.env.ITEMS_PER_PAGE);

	const totalCards = await Card.countDocuments(filters);

	const links = generateLinks(req.baseUrl, req.url, page, totalCards);

	res.status(200).json({ status: 'success', cards, links });
});

export const favouriteCollectionToggle = favouriteItem('collection');

// USE FOR APP INIT ONLY
export const getWholeUserCollection = catchAsync(async (req, res, next) => {
	const { username } = req.params;

	const collection = await Collection.findOne({ username });

	if (!collection) return next(new APIError('No collection found.', 404));

	const cardIds = collection.cards;

	const cards = await Card.find({ card_id: { $in: cardIds } });

	res.status(200).json({ status: 'success', collection: { ...collection._doc, cards } });
});
