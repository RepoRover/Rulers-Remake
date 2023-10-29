import catchAsync from '../helpers/catchAsync.js';
import Collection from './../models/collectionModel.js';
import Trade from './../models/tradeModel.js';
import Card from './../models/cardModel.js';
import Hero from './../models/heroModel.js';
import Transaction from '../models/transactionModel.js';
import APIError from '../helpers/APIError.js';
import Profile from '../models/profileModel.js';

export const getUserProfile = catchAsync(async (req, res, next) => {
	const { username } = req.params;

	// const usreProfile = await Profile.findOne({ username }).select(['username', 'image_path']);
	const userCollection = await Collection.findOne({ username }).select([
		'collection_id',
		'username',
		'image_path',
		'legendary_cards',
		'epic_cards',
		'rare_cards'
	]);

	if (!userCollection) return next(new APIError("Couldn't find profile data.", 404));

	const userTrades = await Trade.find({
		'trade_owner.username': username,
		'trade_accepter.user_id': null
	}).limit(9);

	const populatedTrades = await Promise.all(
		userTrades.map(async (trade) => {
			if (Array.isArray(trade.give)) {
				trade.give = await Card.find({ card_id: { $in: trade.give } });
			}
			if (Array.isArray(trade.take)) {
				trade.take = await Hero.find({ hero_id: { $in: trade.take } });
			}
			return trade;
		})
	);

	const userTransactions = await Transaction.find({
		$or: [{ 'trade_owner.username': username }, { 'trade_accepter.username': username }]
	}).limit(9);

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

	res.status(200).json({
		status: 'success',
		profile: userCollection,
		trades: populatedTrades,
		transactions: populatedTransactions
	});
});

export const getAllUsers = catchAsync(async (req, res, next) => {
	const { username } = req.query;

	if (!username) return next(new APIError("Query 'username' is required.", 400));

	const users = await Profile.find({ username: { $regex: username, $options: 'i' } }).select([
		'username',
		'image_path',
		'profile_id'
	]);

	res.status(200).json({ users });
});
