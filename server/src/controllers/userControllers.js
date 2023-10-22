import catchAsync from '../helpers/catchAsync';
import APIError from '../helpers/APIError';
import findUser from '../helpers/user_helpers/findUser';
import updateUser from '../helpers/user_helpers/updateUser';
import bcryptjs from 'bcryptjs';

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

export const newAvatar = catchAsync(async (req, res, next) => {});

export const deleteAvatar = catchAsync(async (req, res, next) => {});
