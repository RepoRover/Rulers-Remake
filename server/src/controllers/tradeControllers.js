import catchAsync from '../helpers/catchAsync.js';
import Trade from './../models/tradeModel.js';
import APIError from '../helpers/APIError.js';
import {
	validateCards,
	validateBalance,
	validateHeros,
	validateSaleStatus
} from '../helpers/trade_helpers/validateTrade.js';
import {
	newTrade,
	updateInSaleCardStatus,
	updateHeldGemsBalance,
	tradeExecutionOperations
} from '../helpers/trade_helpers/tradeFunctions.js';
import Profile from '../models/profileModel.js';
import Card from '../models/cardModel.js';
import { generateLinks } from '../helpers/linkGenerator.js';
import { favouriteItem } from '../helpers/itemFavourite.js';
import mongoose from 'mongoose';

export const postNewTrade = catchAsync(async (req, res, next) => {
	const { trade } = req.body;
	const { user_id } = req.user;

	if (!trade.take_gems) {
		const validHeroes = await validateHeros(trade.take);
		if (!validHeroes) return next(new APIError('You want to take invalid hero/-s', 400));
	}

	if (!trade.give_gems) {
		const ownershipValid = await validateCards(user_id, trade.give);
		if (!ownershipValid) return next(new APIError("You don't have cards you want to give.", 400));

		const cardsAreNotInSale = await validateSaleStatus(trade.give, 'open');
		if (!cardsAreNotInSale) return next(new APIError('Card/-s already in sale.', 400));
	} else if (trade.give_gems) {
		const enoughGems = await validateBalance(user_id, trade.give);
		if (!enoughGems) return next(new APIError("You don't have enough gems.", 400));

		const userProfile = await Profile.findOne({ profile_id: user_id });

		const updateHoldGems = await Profile.updateOne(
			{ profile_id: user_id },
			{
				gems_available: userProfile.gems_available - trade.give,
				gems_held: userProfile.gems_held + trade.give
			}
		);

		if (!updateHoldGems) return next(new APIError("Couldn't publish your trade.", 500));
	}

	if (trade.trade_accepter.user_id) {
		const tradeAccepterProfile = await Profile.findOne({
			profile_id: trade.trade_accepter.user_id
		});
		if (!tradeAccepterProfile)
			return next(new APIError('No user to accept your trade found.', 404));
	}

	const tradeId = await newTrade(trade, req.user);

	if (!tradeId) return next(new APIError("Couldn't publish your trade.", 500));

	res.status(201).json({ status: 'success', trade_id: tradeId });
});

export const executeTrade = catchAsync(async (req, res, next) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	const tradeExecutionObj = await tradeExecutionOperations(req, session);

	if (tradeExecutionObj.status !== 'success') {
		await session.abortTransaction();
		await session.endSession();
		return next(new APIError(tradeExecutionObj.message, tradeExecutionObj.code));
	}

	await session.commitTransaction();
	await session.endSession();

	res.status(201).json(tradeExecutionObj);
});

export const deleteTrade = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;
	const { trade_id } = req.params;

	const trade = await Trade.findOne({ trade_id });
	if (!trade) return next(new APIError('No trade found.', 404));

	if (trade.trade_owner.user_id !== user_id)
		return next(new APIError("You can't delete this trade.", 401));

	let tradeInFav = true;
	if (trade.trade_accepter.user_id !== null) {
		const accepterProfile = await Profile.findOne({ profile_id: trade.trade_accepter.user_id });

		if (accepterProfile.favourite_trades.includes(trade.trade_id)) {
			const updatedAccepterTrades = accepterProfile.favourite_trades.filter(
				(tradeId) => tradeId !== trade.trade_id
			);

			const updateAccepterProfile = await Profile.updateOne(
				{ profile_id: trade.trade_accepter.user_id },
				{ favourite_trades: updatedAccepterTrades }
			);

			if (!updateAccepterProfile) return next(new APIError("Couldn't delete your trade.", 500));

			tradeInFav = false;
		}
	}

	let cardInSaleStatusUpdated = null;
	let heldBalanceUpdated = null;
	if (!trade.give_gems) {
		cardInSaleStatusUpdated = await updateInSaleCardStatus(trade.give, req.user, false);
	} else {
		heldBalanceUpdated = await updateHeldGemsBalance(user_id, trade, 'close');
	}

	const tradeDeleted = await Trade.deleteOne({ trade_id });

	if (!tradeDeleted || (!cardInSaleStatusUpdated && !heldBalanceUpdated)) {
		if (!cardInSaleStatusUpdated && !trade.give_gems) {
			await updateInSaleCardStatus(trade.give, req.user, true);
		} else if (!heldBalanceUpdated && trade.give_gems) {
			await updateHeldGemsBalance(user_id, trade, 'open');
		}

		if (!tradeInFav) {
			const accepterProfile = await Profile.findOne({ profile_id: trade.trade_accepter.user_id });
			const addBackToFav = [trade.trade_id, ...accepterProfile.favourite_trades];
			await Profile.updateOne(
				{ profile_id: trade.trade_accepter.user_id },
				{ favourite_trades: addBackToFav }
			);
		}
		return next(new APIError("Couldn't delete your trade.", 500));
	}

	res.status(200).json({ status: 'success' });
});

// eslint-disable-next-line no-unused-vars
export const getAllTrades = catchAsync(async (req, res, next) => {
	const { page = 1, trade_type, search, role, rarity } = req.query;

	const skip = (page - 1) * process.env.ITEMS_PER_PAGE;

	let filters = {
		'trade_accepter.user_id': null
	};

	const metaDataFilters = [];
	if (search) {
		metaDataFilters.push({ $elemMatch: { $regex: new RegExp(search, 'i') } });
	}
	if (rarity) {
		metaDataFilters.push({ $elemMatch: { $regex: new RegExp(rarity, 'i') } });
	}
	if (role) {
		metaDataFilters.push({ $elemMatch: { $regex: new RegExp(role, 'i') } });
	}

	if (trade_type && trade_type === 'cards') {
		filters.give = { $type: 'array' };
	} else if (trade_type && trade_type === 'gems') {
		filters.give = { $type: 'number' };
	}

	if (metaDataFilters.length > 0) {
		filters.metadata = { $all: metaDataFilters };
	}

	const trades = await Trade.find(filters).skip(skip).limit(process.env.ITEMS_PER_PAGE);
	const totalTrades = await Trade.countDocuments(filters);

	const populatedTrades = await Promise.all(
		trades.map(async (trade) => {
			if (Array.isArray(trade.give)) {
				trade.give = await Card.find({ card_id: { $in: trade.give } });
			}
			if (Array.isArray(trade.take)) {
				trade.take = await Card.find({ card_id: { $in: trade.take } });
			}
			return trade;
		})
	);

	const links = generateLinks(req.baseUrl, req.url, page, totalTrades);

	res.status(200).json({
		status: 'success',
		trades: populatedTrades,
		links
	});
});

export const favouriteTrade = favouriteItem('trade');
