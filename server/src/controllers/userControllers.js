import catchAsync from '../helpers/catchAsync.js';
import APIError from '../helpers/APIError.js';
import findUser from '../helpers/user_helpers/findUser.js';
import updateUser from '../helpers/user_helpers/updateUser.js';
import Profile from './../models/profileModel.js';
import Collection from './../models/collectionModel.js';
import bcryptjs from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

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

export const accountDelete = catchAsync(async (req, res, next) => {});

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

		fs.unlink(path.join(__dirname, `./../../../src/assets/users/${req.file.filename}`), (err) => {
			if (err) return next(new APIError('Failed to delete new avatar.', 500));
		});

		return next(new APIError('Failed to upload your avatar.', 500));
	}

	if (userProfile.image_path !== '/src/assets/default_profile.webp') {
		fs.unlink(path.join(__dirname, `./../../..${userProfile.image_path}`), (err) => {
			if (err) return next(new APIError('Failed to delete old avatar.', 500));
		});
	}
	res.status(200).json({ status: 'success' });
});

export const deleteAvatar = catchAsync(async (req, res, next) => {});

export const getUser = catchAsync(async (req, res, next) => {});
