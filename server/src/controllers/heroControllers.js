import APIError from '../helpers/APIError.js';
import catchAsync from '../helpers/catchAsync.js';
import Hero from './../models/heroModel.js';

export const getAllHeros = catchAsync(async (req, res, next) => {
	const { hero_name } = req.query;

	let filters = {};
	if (hero_name) filters.name = { $regex: hero_name, $options: 'i' };

	const heros = await Hero.find(filters).select(['name', 'hero_id', 'rarity']);
	if (!heros) return next(new APIError('Something went wrong.', 500));

	res.status(200).json({ status: 'success', heros });
});
