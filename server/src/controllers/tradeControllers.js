import { v4 } from 'uuid';
import catchAsync from '../helpers/catchAsync';
import Trade from './../models/tradeModel';
import APIError from '../helpers/APIError';
import {
	validateCards,
	validateBalance,
	validateHeros,
	validateSaleStatus
} from '../helpers/validateTrade';
import { newTrade } from '../helpers/trade_helpers/tradeFunctions';

export const getAllTrades = catchAsync(async (req, res, next) => {
	// // Extracting query params
	// const { page = 1, rarity, role, favourites, offerType } = req.query;
	// // Build the filters based on query params
	// const filters = {};
	// if (rarity) filters.rarity = rarity;
	// if (role) filters.role = role;
	// if (offerType === 'cards') filters.give_gems = false;
	// if (offerType === 'gems') filters.give_gems = true;
	// if (favourites) {
	// 	// Assuming you have access to logged-in user data
	// 	const user = await Profile.findById(req.user._id);
	// 	filters._id = { $in: user.favourite_trades };
	// }
	// // Pagination
	// const limit = 36;
	// const skip = (Number(page) - 1) * limit;
	// // Fetching the trades
	// const trades = await Trade.find(filters).limit(limit).skip(skip);
	// // Count the total number of trades to calculate total pages
	// const totalTrades = await Trade.countDocuments(filters);
	// const totalPages = Math.ceil(totalTrades / limit);
	// // Build the pagination links
	// const generateLink = (pageNumber) =>
	// 	`/trades?page=${pageNumber}${rarity ? `&rarity=${rarity}` : ''}${role ? `&role=${role}` : ''}${
	// 		favourites ? `&favourites=${favourites}` : ''
	// 	}${offerType ? `&offerType=${offerType}` : ''}`;
	// const links = {
	// 	first: generateLink(1),
	// 	last: generateLink(totalPages),
	// 	prev3: page - 3 > 0 ? generateLink(page - 3) : null,
	// 	prev2: page - 2 > 0 ? generateLink(page - 2) : null,
	// 	prev1: page - 1 > 0 ? generateLink(page - 1) : null,
	// 	next1: page + 1 <= totalPages ? generateLink(page + 1) : null,
	// 	next2: page + 2 <= totalPages ? generateLink(page + 2) : null,
	// 	next3: page + 3 <= totalPages ? generateLink(page + 3) : null
	// };
	// // Sending response
	// res.json({ trades, links });
});

export const postNewTrade = catchAsync(async (req, res, next) => {
	const { trade } = req.body;
	const { user_id } = req.user;

	if (
		!(Array.isArray(trade.give) || typeof trade.give === 'number') ||
		!(Array.isArray(trade.take) || typeof trade.take === 'number') ||
		typeof trade.give_gems !== 'boolean' ||
		typeof trade.take_gems !== 'boolean'
	) {
		return next(new APIError('Invalid trade info.', 400));
	}

	if (
		(trade.give_gems === true && trade.take_gems === true) ||
		(typeof trade.give === 'number' && typeof trade.take === 'number')
	) {
		return next(new APIError("You can't exchange gems for gems.", 400));
	}

	if (Array.isArray(trade.give)) {
		const ownershipValid = await validateCards(user_id, trade.give);
		if (!ownershipValid) return next(new APIError("You don't have cards you want to give.", 400));

		const cardsAreNotInSale = await validateSaleStatus(trade.give, 'open');
		if (!cardsAreNotInSale) return next(new APIError('Card/-s are already in sale.', 400));
	} else if (typeof trade.give === 'number') {
		const enoughGems = await validateBalance(user_id, trade.give);
		if (!enoughGems) return next(new APIError("You don't have enough gems.", 400));
	}

	if (Array.isArray(trade.take)) {
		const validHeroes = await validateHeros(trade.take);
		if (!validHeroes) return next(new APIError('You want to take invalid hero/-s', 400));
	}

	const tradeId = await newTrade(trade, req.user);

	if (!tradeId) return next(new APIError("Couldn't publish your trade", 500));

	res.status(200).json({ status: 'success', trade_id: tradeId });
});

export const deleteTrade = catchAsync(async (req, res, next) => {});
