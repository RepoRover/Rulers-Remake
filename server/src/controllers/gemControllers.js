import APIError from '../helpers/APIError.js';
import catchAsync from '../helpers/catchAsync.js';
import GemSet from '../models/gemSetModel.js';
import Profile from '../models/profileModel.js';

// eslint-disable-next-line no-unused-vars
export const getAllGemSets = catchAsync(async (req, res, next) => {
	const gemSets = await GemSet.find().sort({ price: 1 });

	res.status(200).json({ status: 'success', gem_sets: gemSets });
});

export const purchaseGemSet = catchAsync(async (req, res, next) => {
	const { gem_set_id } = req.params;
	const { user_id } = req.user;

	const gemSet = await GemSet.findOne({ gem_set_id });

	if (gemSet.available === false) return next(new APIError('Gem set is unavailable.', 403));

	// Some E-commerce functionality here

	const userProfile = await Profile.findOne({ profile_id: user_id });

	if (gemSet.price === 0) {
		if (userProfile.free_gem_sets <= 0)
			return next(new APIError("You don't have free gem sets left", 400));

		await Profile.updateOne({ profile_id: user_id }, { $inc: { free_gem_sets: -1 } });
	}

	const giveGems = await Profile.updateOne(
		{ profile_id: user_id },
		{ $inc: { gems_available: gemSet.gem_amount } }
	);

	if (!giveGems) return next(new APIError('Something went wrong.', 500));

	res.status(200).json({ status: 'success' });
});
