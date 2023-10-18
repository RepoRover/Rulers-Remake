import jwt from 'jsonwebtoken';
import catchAsync from './catchAsync.js';
import APIError from './APIError.js';
import findUser from './user_helpers/findUser.js';

const protect = catchAsync(async (req, res, next) => {
	let accessToken;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		accessToken = req.headers.authorization.split(' ')[1];
	}

	if (!accessToken) return next(new APIError('No token provided.', 403));

	const payload = jwt.decode(accessToken, process.env.ACCESS_TOKEN_SECRET);

	if (!payload) return next(new APIError('Invalid token.', 403));

	const userId = payload.user_id;
	if (!userId) return next(new APIError('No user id provided', 400));

	let user;

	if (userId) {
		user = await findUser({ user_id: userId });
	} else {
		return next(new APIError('No user id included in provided token.', 401));
	}

	if (!user) return next(new APIError('No user found with given id.', 403));

	// eslint-disable-next-line no-unused-vars
	jwt.verify(user.refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
		if (err) return next(new APIError('Invalid token.', 403));
	});
	req.user = user;
	next();
});

export default protect;
