import catchAsync from './catchAsync.js';
import Profile from '../models/profileModel.js';
import APIError from './APIError.js';
import Collection from '../models/collectionModel.js';
import Card from '../models/cardModel.js';
import Trade from '../models/tradeModel.js';

export const favouriteItem = (itemName) => {
	return catchAsync(async (req, res, next) => {
		const { user_id } = req.user;

		let Model, notFoundMessage, itemSearchKey, itemSearchValue, profileField, successMessagePrefix;

		switch (itemName) {
			case 'card':
				Model = Card;
				notFoundMessage = 'No card to favourite found.';
				itemSearchKey = 'card_id';
				itemSearchValue = req.params.card_id;
				profileField = 'favourite_cards';
				successMessagePrefix = 'Card';
				break;
			case 'trade':
				Model = Trade;
				notFoundMessage = 'No trade to favourite found.';
				itemSearchKey = 'trade_id';
				itemSearchValue = req.params.trade_id;
				profileField = 'favourite_trades';
				successMessagePrefix = 'Trade';
				break;
			case 'collection':
				Model = Collection;
				notFoundMessage = 'No collection to favourite found.';
				itemSearchKey = 'username';
				itemSearchValue = req.params.username;
				profileField = 'favourite_collections';
				successMessagePrefix = `${req.params.username}'s collection`;
				break;
			default:
				return next(new APIError('Invalid item to favourite.', 400));
		}

		const item = await Model.findOne({ [itemSearchKey]: itemSearchValue });
		if (!item) return next(new APIError(notFoundMessage, 404));

		if (itemName === 'trade' && user_id !== item.trade_accepter.user_id)
			return next(new APIError('You can favourite direct trades only.', 401));

		const profile = await Profile.findOne({ profile_id: user_id });
		const alreadyFavourited = profile[profileField].includes(item[itemSearchKey]);

		const profileUpdate = await Profile.findOneAndUpdate(
			{ profile_id: user_id },
			alreadyFavourited
				? { $pull: { [profileField]: item[itemSearchKey] } }
				: { $push: { [profileField]: item[itemSearchKey] } },
			{ new: true }
		);

		if (!profileUpdate) return next(new APIError("Couldn't update favourites.", 500));

		const action = profileUpdate[profileField].includes(item[itemSearchKey])
			? 'added to'
			: 'removed from';
		const successMessage = `${successMessagePrefix} ${action} favourites.`;

		res.status(200).json({
			status: 'success',
			message: successMessage
		});
	});
};
