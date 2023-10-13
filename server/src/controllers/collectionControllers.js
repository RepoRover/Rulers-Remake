import APIError from '../helpers/APIError';
import catchAsync from '../helpers/catchAsync';
import Collection from '../models/collectionModel';
// import { getAll } from './../helpers/handlerFactory';

export const getAllCollections = catchAsync(async (req, res, next) => {
	const page = req.query.page;
	const limit = 24;
	const skip = (page - 1) * limit;

	const collections = await Collection.find().skip(skip).limit(limit);

	res.status(200).json({ status: 'success', results: collections.length, collections });
});
