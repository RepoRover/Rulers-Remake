import catchAsync from '../helpers/catchAsync.js';
import APIError from '../helpers/APIError.js';
import findUser from '../helpers/user_helpers/findUser.js';
import updateUser from '../helpers/user_helpers/updateUser.js';
import Profile from './../models/profileModel.js';
import Collection from './../models/collectionModel.js';
import Trade from './../models/tradeModel.js';
import bcryptjs from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { openDefaultTrade } from '../helpers/trade_helpers/tradeFunctions.js';
import { generateLinks } from './../helpers/linkGenerator.js';
import Hero from '../models/heroModel.js';
import Card from '../models/cardModel.js';
import Transaction from '../models/transactionModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

export const getDirectTrades = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;
	const { page = 1, favourites, trade_type, search } = req.query;

	const skip = (page - 1) * process.env.ITEMS_PER_PAGE;

	let filters = {
		'trade_accepter.user_id': user_id
	};

	if (search) {
		const regex = new RegExp(search, 'i');
		filters.metadata = { $elemMatch: { $regex: regex } };
	}

	if (favourites) {
		const profile = await Profile.findOne({ profile_id: user_id });
		if (!profile) return next(new APIError('No user found.', 404));

		filters.trade_id = { $in: profile.favourite_trades };
	}

	if (trade_type && trade_type === 'cards') {
		filters.give = { $type: 'array' };
	} else if (trade_type && trade_type === 'gems') {
		filters.give = { $type: 'number' };
	}

	const trades = await Trade.find(filters).skip(skip).limit(process.env.ITEMS_PER_PAGE);
	const totalTrades = await Trade.countDocuments(filters);

	const populatedTrades = await Promise.all(
		trades.map(async (trade) => {
			if (Array.isArray(trade.give)) {
				trade.give = await Card.find({ card_id: { $in: trade.give } });
			}
			if (Array.isArray(trade.take)) {
				trade.take = await Hero.find({ hero_id: { $in: trade.take } });
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

export const changePassword = catchAsync(async (req, res, next) => {
	const { current_password, new_password, new_password_confirm } = req.body;
	const { user_id } = req.user;

	if (!current_password || !new_password || !new_password_confirm)
		return next(new APIError('No passwords provided.', 400));

	if (new_password !== new_password_confirm)
		return next(new APIError("Passwords don't match.", 400));

	const userDoc = await findUser({ user_id });

	const isMatch = await bcryptjs.compare(current_password, userDoc.password);

	if (isMatch === false) {
		return next(new APIError('Invalid credentioals.', 401));
	}

	const hashedPwd = await bcryptjs.hash(new_password, 10);

	const updatedUser = await updateUser({ user_id }, { password: hashedPwd });

	if (!updatedUser) return next(new APIError('Something went wrong.', 500));

	res.status(200).json({ status: 'success', message: 'Password changed.' });
});

export const changeUsername = catchAsync(async (req, res, next) => {
	const { current_password, new_username } = req.body;
	const { user_id } = req.user;

	if (!current_password || !new_username) return next(new APIError('No passwords provided.', 400));

	const userDoc = await findUser({ user_id });

	const isMatch = await bcryptjs.compare(current_password, userDoc.password);

	if (isMatch === false) {
		return next(new APIError('Invalid credentioals.', 401));
	}

	const usernameInUse = await findUser({ username: new_username });

	if (usernameInUse) return next(new APIError('Usesrname already in use.', 409));

	const updatedUser = await updateUser({ user_id }, { username: new_username });

	if (!updatedUser) return next(new APIError('Something went wrong.', 500));

	res.status(200).json({ status: 'success', message: 'Username changed.' });
});

export const newAvatar = catchAsync(async (req, res, next) => {
	if (!req.file) {
		return next(new APIError('Failed to upload your avatar.', 500));
	}

	const { user_id } = req.user;
	const setObj = { $set: { image_path: `/src/assets/users/${req.file.filename}` } };

	const userProfile = await Profile.findOne({ profile_id: user_id });

	const updatedProfile = await Profile.updateOne({ profile_id: user_id }, setObj);
	const updatedCollection = await Collection.updateOne({ collection_id: user_id }, setObj);

	if (!updatedProfile || !updatedCollection) {
		let resetObj = { $set: { image_path: userProfile.image_path } };
		await Profile.updateOne({ profile_id: user_id }, resetObj);
		await Collection.updateOne({ collection_id: user_id }, resetObj);

		fs.unlink(path.join(__dirname, `./../../../src/assets/users/${req.file.filename}`));

		return next(new APIError('Failed to upload your avatar.', 500));
	}

	if (userProfile.image_path !== process.env.DEFAULT_ACC_IMG_PATH) {
		fs.unlink(path.join(__dirname, `./../../..${userProfile.image_path}`), (err) => {
			if (err) return next(new APIError('Failed to delete old avatar.', 500));
		});
	}
	res.status(200).json({ status: 'success' });
});

export const deleteAvatar = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;

	const userProfile = await Profile.findOne({ profile_id: user_id });

	if (userProfile.image_path === process.env.DEFAULT_ACC_IMG_PATH)
		return next(new APIError("You can't delete default avatar.", 403));

	const setObj = { $set: { image_path: process.env.DEFAULT_ACC_IMG_PATH } };

	const updatedProfile = await Profile.updateOne({ profile_id: user_id }, setObj);
	const updatedCollection = await Collection.updateOne({ collection_id: user_id }, setObj);

	if (!updatedProfile || !updatedCollection) {
		let resetObj = { $set: { image_path: userProfile.image_path } };
		await Profile.updateOne({ profile_id: user_id }, resetObj);
		await Collection.updateOne({ collection_id: user_id }, resetObj);

		return next(new APIError("Couldn't delete your avatar.", 500));
	}

	fs.unlink(path.join(__dirname, `./../../..${userProfile.image_path}`), async (err) => {
		if (err) {
			let resetObj = { $set: { image_path: userProfile.image_path } };
			await Profile.updateOne({ profile_id: user_id }, resetObj);
			await Collection.updateOne({ collection_id: user_id }, resetObj);

			return next(new APIError('Failed to delete old avatar.', 500));
		}
	});

	res.status(200).json({ status: 'success' });
});

const isMainAccount = (username) => username === process.env.MAIN_ACC_NAME;

const mergeCollections = async (userId, session) => {
	const [userCollection, mainAccCollection] = await Promise.all([
		Collection.findOne({ collection_id: userId }),
		Collection.findOne({ username: process.env.MAIN_ACC_NAME })
	]);

	if (userCollection.cards.length > 0) {
		const mainAccUpdatedCards = [...userCollection.cards, ...mainAccCollection.cards];
		await Collection.updateOne(
			{ username: process.env.MAIN_ACC_NAME },
			{
				$set: {
					cards: mainAccUpdatedCards,
					legendary_cards: userCollection.legendary_cards + mainAccCollection.legendary_cards,
					epic_cards: userCollection.epic_cards + mainAccCollection.epic_cards,
					rare_cards: userCollection.rare_cards + mainAccCollection.rare_cards
				}
			},
			{ session }
		);
		await Collection.updateOne(
			{ collection_id: userId },
			{ $set: { cards: [], legendary_cards: 0, epic_cards: 0, rare_cards: 0 } },
			{ session }
		);
	}

	return userCollection;
};

const deleteUserOperations = async (req, session) => {
	const { user_id, username } = req.user;
	const userCollection = await mergeCollections(user_id, session);

	const userTradesToUsers = await Trade.find({
		'trade_owner.user_id': user_id,
		'trade_accepter.user_id': { $nin: [null, process.env.DELETED_ACC_PLACEHOLDER] }
	});

	if (userTradesToUsers.length > 0) {
		for (const directTrade of userTradesToUsers) {
			await Profile.updateOne(
				{ profile_id: directTrade.trade_accepter.user_id },
				{ $pull: { favourite_trades: directTrade.trade_id } },
				{ session }
			);
		}
	}

	const [
		tradesDeleted,
		defaultTradesOpened,
		directTradesUpdated,
		deletedFromFavCollections,
		deletedFromTransactions,
		profileDeleted,
		collectionDeleted,
		userDeleted
	] = await Promise.all([
		Trade.deleteMany({ 'trade_owner.user_id': user_id }, { session }),
		openDefaultTrade(userCollection.cards, session),
		Trade.updateMany(
			{ 'trade_accepter.user_id': user_id },
			{
				$set: {
					'trade_accepter.user_id': process.env.DELETED_ACC_PLACEHOLDER,
					'trade_accepter.username': process.env.DELETED_ACC_PLACEHOLDER
				}
			},
			{ session }
		),
		Profile.updateMany(
			{ favourite_collections: { $in: [username] } },
			{ $pull: { favourite_collections: username } },
			{ session }
		),
		Transaction.updateMany(
			{
				$or: [{ 'trade_accepter.user_id': user_id }, { 'trade_owner.user_id': user_id }]
			},
			[
				{
					$set: {
						'trade_accepter.user_id': {
							$cond: [
								{ $eq: ['$trade_accepter.user_id', user_id] },
								process.env.DELETED_ACC_PLACEHOLDER,
								'$trade_accepter.user_id'
							]
						},
						'trade_accepter.username': {
							$cond: [
								{ $eq: ['$trade_accepter.user_id', user_id] },
								process.env.DELETED_ACC_PLACEHOLDER,
								'$trade_accepter.username'
							]
						},
						'trade_owner.user_id': {
							$cond: [
								{ $eq: ['$trade_owner.user_id', user_id] },
								process.env.DELETED_ACC_PLACEHOLDER,
								'$trade_owner.user_id'
							]
						},
						'trade_owner.username': {
							$cond: [
								{ $eq: ['$trade_owner.user_id', user_id] },
								process.env.DELETED_ACC_PLACEHOLDER,
								'$trade_owner.username'
							]
						}
					}
				}
			],
			{ session }
		),
		Profile.deleteOne({ profile_id: user_id }, { session }),
		Collection.deleteOne({ collection_id: user_id }, { session }),
		User.deleteOne({ user_id }, { session })
	]);

	if (userCollection.image_path !== process.env.DEFAULT_ACC_IMG_PATH) {
		fs.access(`./../../..${userCollection.image_path}`, fs.constants.F_OK, (err) => {
			if (err) return false;
			fs.unlink(path.join(__dirname, `./../../..${userCollection.image_path}`), (err) => {
				if (err) return false;
			});
		});
	}

	if (
		!tradesDeleted ||
		!defaultTradesOpened ||
		!directTradesUpdated ||
		!deletedFromFavCollections ||
		!deletedFromTransactions ||
		!profileDeleted ||
		!collectionDeleted ||
		!userDeleted
	) {
		return false;
	}

	return true;
};

export const accountDelete = catchAsync(async (req, res, next) => {
	const { user_id, username } = req.user;
	if (isMainAccount(username)) return next(new APIError("You can't delete this account.", 401));

	const { password } = req.body;

	const userDoc = await findUser({ user_id });

	if (!userDoc) {
		return next(new APIError('User not found.', 404));
	}

	const isMatch = await bcryptjs.compare(password, userDoc.password);

	if (isMatch === false) {
		return next(new APIError('Wrong password.', 403));
	}

	const session = await mongoose.startSession();
	session.startTransaction();

	const accDeleted = await deleteUserOperations(req, session);

	if (!accDeleted) {
		await session.abortTransaction();
		await session.endSession();
		return next(new APIError('Something went wrong while deleting your account.', 500));
	}

	await session.commitTransaction();
	await session.endSession();

	res.status(200).json({ status: 'success' });
});

// eslint-disable-next-line no-unused-vars
export const getUserCards = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;
	const { name_search } = req.query;

	let filters = { 'card_owner.user_id': user_id, in_sale: false };

	if (name_search) {
		filters.name = { $regex: name_search, $options: 'i' };
	}

	const userCards = await Card.find(filters).select([
		'-in_sale',
		'-hero_id',
		'-card_owner',
		'-description',
		'-hero_link'
	]);

	res.status(200).json({ status: 'success', user_cards: userCards });
});

// eslint-disable-next-line no-unused-vars
export const getUser = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;

	const userProfile = await Profile.findOne({ profile_id: user_id }).select(['-_id', '-gems_held']);

	const directTrades = await Trade.find({ 'trade_accepter.user_id': user_id });

	res.status(200).json({
		user: userProfile,
		direct_trades: directTrades.length
	});
});
