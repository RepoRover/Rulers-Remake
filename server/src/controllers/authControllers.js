import User from "../models/userModel";
import catchAsync from "../helpers/catchAsync";
import APIError from "../helpers/APIError";
import bcryptjs from "bcryptjs";
import signTokens from "../helpers/signTokens";
import updateUser from "../helpers/user_helpers/updateUser";
import findUser from "../helpers/user_helpers/findUser";
import { v4 } from "uuid";

export const checkUserNameAndPwd = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return next(new APIError("No username or password provided.", 400));
  }
  next();
};

export const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  const userDoc = await findUser({ username });

  if (!userDoc) {
    return next(new APIError("User not found.", 404));
  }

  const isMatch = await bcryptjs.compare(password, userDoc.password);

  if (isMatch === false) {
    return next(new APIError("Invalid credentioals.", 403));
  }

  const { accessToken, refreshToken } = signTokens(userDoc.user_id);

  const updatedUser = await updateUser(
    { user_id: userDoc.user_id },
    { refresh_token: refreshToken }
  );

  if (!updatedUser) {
    return next(
      new APIError("An error occurred while creating your account.", 500)
    );
  }

  res.status(200).json({ status: "success", access_token: accessToken });
});

export const signup = catchAsync(async (req, res, next) => {
  const { username, password, password_confirm } = req.body;

  if (!password_confirm) {
    return next(new APIError("Please confirm your password.", 400));
  }
  if (password !== password_confirm) {
    return next(new APIError("Please check if your passwords match.", 400));
  }

  const hashedPwd = await bcryptjs.hash(password, 10);
  const userId = v4();
  const { accessToken, refreshToken } = signTokens(userId);

  const newUser = new User({
    user_id: userId,
    username,
    password: hashedPwd,
    refresh_token: refreshToken,
  });

  await newUser.save();

  res.status(200).json({ status: "success", access_token: accessToken });
});

export const logoutAll = catchAsync(async (req, res, next) => {
  const userId = req.user.user_id;

  const updatedUser = await updateUser(
    { user_id: userId },
    { refresh_token: null }
  );

  if (!updatedUser) {
    return next(new APIError("Could not log you out.", 500));
  }

  res.status(200).json({ status: "success", message: "You logged out." });
});

export const refresh = catchAsync(async (req, res, next) => {
  const { user_id } = req.user;

  const { accessToken, refreshToken } = signTokens(user_id);

  const updatedUser = await updateUser(
    { user_id: user_id },
    { refresh_token: refreshToken }
  );

  if (!updatedUser) {
    return next(new APIError("Could not refresh tokens.", 500));
  }

  res.status(200).json({ status: "success", access_token: accessToken });
});
