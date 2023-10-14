import { v4 } from 'uuid';
import catchAsync from '../helpers/catchAsync';
import Trade from './../models/tradeModel';
import APIError from '../helpers/APIError';
import { validateCards, validateBalance, validateHeros } from '../helpers/validateTrade';

export const getAllTrades = catchAsync(async (req, res, next) => {});

export const postNewTrade = catchAsync(async (req, res, next) => {
	const { trade } = req.body;
	const { user_id, username } = req.user;

	// Check if all the required trade fields exist
	if (
		!Array.isArray(trade.give) ||
		!(typeof trade.give !== 'number') ||
		!Array.isArray(trade.take) ||
		!(typeof trade.take !== 'number') ||
		typeof trade.give_gems !== 'boolean' ||
		typeof trade.take_gems !== 'boolean'
	) {
		return next(new APIError('Invalid trade info.', 400));
	}

	// Check if user is trying to exchange gems for gems
	if (
		(trade.give_gems === true && trade.take_gems === true) ||
		(typeof trade.give === 'number' && typeof trade.take === 'number')
	) {
		return next(new APIError("You can't exchange gems for gems.", 400));
	}

	// Prove user ability to open a trade
	// if he gives cards, check his ownership rights
	// if he gives gems, check his gem balance
	if (Array.isArray(trade.give)) {
		const ownershipValid = await validateCards(user_id, trade.give);
		if (!ownershipValid) return next(new APIError("You don't have cards you want to give.", 400));
	} else if (typeof trade.give === 'number') {
		const enoughGems = await validateBalance(user_id, trade.give);
		if (!enoughGems) return next(new APIError("You don't have enough gems.", 400));
	}

	// Check if the requesting hero/-s exists
	if (Array.isArray(trade.take)) {
		const validHeroes = await validateHeros(trade.take);
		if (!validHeroes) return next(new APIError('You want to take invalid hero/-s', 400));
	}

	const trade_id = v4();
	const newTrade = new Trade({
		trade_id,
		trade_status: 'open',
		trade_owner: {
			user_id,
			username
		},
		trade_accepter: {
			user_id: null,
			username: null
		},
		...trade
	});

	const tradeSave = await newTrade.save();

	if (!tradeSave) return next(new APIError("Couldn't publish your trade", 500));

	res.status(200).json({ status: 'success', trade_id: tradeSave.trade_id });
});

export const deleteTrade = catchAsync(async (req, res, next) => {});
