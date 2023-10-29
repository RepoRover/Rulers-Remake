import catchAsync from '../helpers/catchAsync';
import Profile from './../models/profileModel.js';
import APIError from './../helpers/APIError.js';
import Transaction from './../models/transactionModel.js';
import { generateLinks } from '../helpers/linkGenerator.js';
import Card from '../models/cardModel.js';
import Hero from '../models/heroModel.js';

export const getUserTransactions = catchAsync(async (req, res, next) => {
	const { username } = req.params;
	const { page = 1 } = req.query;

	const skip = (page - 1) * process.env.ITEMS_PER_PAGE;

	const userProfile = await Profile.findOne({ username });
	if (!userProfile) return next(new APIError('No user found.', 404));

	const filters = {
		$or: [{ 'trade_owner.username': username }, { 'trade_accepter.username': username }]
	};
	const userTransactions = await Transaction.find(filters)
		.sort({ created_at: -1 })
		.skip(skip)
		.limit(process.env.ITEMS_PER_PAGE);

	const populatedTransactions = await Promise.all(
		userTransactions.map(async (trade) => {
			if (Array.isArray(trade.give)) {
				trade.give = await Card.find({ card_id: { $in: trade.give } });
			}
			if (Array.isArray(trade.take)) {
				trade.take = await Hero.find({ hero_id: { $in: trade.take } });
			}
			return trade;
		})
	);

	const totalTransactions = await Transaction.countDocuments(filters);

	const links = generateLinks(req.baseUrl, req.url, page, totalTransactions);

	res.status(200).json({ status: 'success', user_transactions: populatedTransactions, links });
});

export const getSingleTransaction = catchAsync(async (req, res, next) => {
	const { transaction_id } = req.params;

	res.status(200).json({ status: 'success', user_transactions: 'single' });
});
