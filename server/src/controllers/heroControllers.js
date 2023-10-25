import APIError from '../helpers/APIError';
import catchAsync from '../helpers/catchAsync';
import Hero from './../models/heroModel.js';

export const getAllHeros = catchAsync(async (req, res, next) => {
	const heros = await Hero.find().select(['name', 'hero_id', 'rarity']);
	if (!heros) return next(new APIError('Something went wrong.', 500));

	res.status(200).json({ status: 'success', heros });
});
