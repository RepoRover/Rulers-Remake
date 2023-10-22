import User from '../models/userModel.js';
import Profile from '../models/profileModel.js';
import Collection from '../models/collectionModel.js';
import catchAsync from '../helpers/catchAsync.js';
import APIError from '../helpers/APIError.js';
import bcryptjs from 'bcryptjs';
import signTokens from '../helpers/signTokens.js';
import updateUser from '../helpers/user_helpers/updateUser.js';
import findUser from '../helpers/user_helpers/findUser.js';
import { v4 } from 'uuid';

export const checkUserNameAndPwd = (req, res, next) => {
	const { username, password } = req.body;
	if (!username || !password) {
		return next(new APIError('No username or password provided.', 400));
	}
	next();
};

// Function to LOGIN into user existing account
export const login = catchAsync(async (req, res, next) => {
	const { username, password } = req.body;

	const userDoc = await findUser({ username });

	if (!userDoc) {
		return next(new APIError('User not found.', 404));
	}

	const isMatch = await bcryptjs.compare(password, userDoc.password);

	if (isMatch === false) {
		return next(new APIError('Invalid credentioals.', 403));
	}

	const { accessToken, refreshToken } = signTokens(userDoc.user_id);

	const updatedUser = await updateUser(
		{ user_id: userDoc.user_id },
		{ refresh_token: refreshToken }
	);

	if (!updatedUser) {
		return next(new APIError('An error occurred while creating your account.', 500));
	}

	res.status(200).json({ status: 'success', access_token: accessToken });
});

// Function to create NEW account
export const signup = catchAsync(async (req, res, next) => {
	const { username, password, password_confirm } = req.body;

	if (!password_confirm) {
		return next(new APIError('Please confirm your password.', 400));
	}
	if (password !== password_confirm) {
		return next(new APIError('Please check if your passwords match.', 400));
	}

	const hashedPwd = await bcryptjs.hash(password, 10);
	const userId = v4();
	const { accessToken, refreshToken } = signTokens(userId);

	const newUser = new User({
		user_id: userId,
		username,
		password: hashedPwd,
		refresh_token: refreshToken
	});

	const userProfile = new Profile({
		profile_id: userId,
		username,
		gems_available: 0,
		gems_held: 0,
		image_path: '/src/assets/default_profile.webp',
		free_gem_sets: 5,
		favourite_trades: [],
		favourite_collections: [],
		favourite_cards: []
	});

	const collection = new Collection({
		collection_id: userId,
		username,
		image_path: '/src/assets/default_profile.webp',
		cards: [],
		rare_cards: 0,
		epic_cards: 0,
		legendary_cards: 0
	});

	const userSave = newUser.save();
	const profileSave = userProfile.save();
	const collectionSave = collection.save();
	const [userSaveResult, profileSaveResult, collectionSaveResult] = await Promise.all([
		userSave,
		profileSave,
		collectionSave
	]);

	if (!userSaveResult || !profileSaveResult || !collectionSaveResult) {
		return next(new APIError('Something went wrong while creating your profile.', 500));
	}

	res.status(200).json({ status: 'success', access_token: accessToken });
});

export const logoutAll = catchAsync(async (req, res, next) => {
	const userId = req.user.user_id;

	const updatedUser = await updateUser({ user_id: userId }, { refresh_token: null });

	if (!updatedUser) {
		return next(new APIError('Could not log you out.', 500));
	}

	res.status(200).json({ status: 'success', message: 'You logged out.' });
});

export const refresh = catchAsync(async (req, res, next) => {
	const { user_id } = req.user;

	const { accessToken, refreshToken } = signTokens(user_id);

	const updatedUser = await updateUser({ user_id }, { refresh_token: refreshToken });

	if (!updatedUser) {
		return next(new APIError('Could not refresh tokens.', 500));
	}

	res.status(200).json({ status: 'success', access_token: accessToken });
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

	const usernameInUse = await User.findOne({ username: new_username });

	if (usernameInUse) return next(new APIError('Usesrname already in use.', 409));

	const updatedUser = await updateUser({ user_id }, { username: new_username });

	if (!updatedUser) return next(new APIError('Something went wrong.', 500));

	res.status(200).json({ status: 'success', message: 'Username changed.' });
});

export const accountDelete = catchAsync(async (req, res, next) => {});
