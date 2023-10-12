import jwt from "jsonwebtoken";
import catchAsync from "./catchAsync";
import APIError from "./APIError";
import findUser from "./user_helpers/findUser";

const protect = catchAsync(async (req, res, next) => {
  let accessToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    accessToken = req.headers.authorization.split(" ")[1];
  }

  if (!accessToken) {
    return next(new APIError("No token provided.", 403));
  }

  let userId;
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return next(new APIError("Invalid token.", 403));
    }
    userId = decoded.user_id;
  });

  let user;

  if (userId) {
    user = await findUser({ user_id: userId });
  } else {
    return next(new APIError("No user id included in provided token.", 401));
  }

  if (!user) {
    return next(new APIError("No user found with given id.", 403));
  }

  jwt.verify(
    user.refresh_token,
    process.env.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
      if (err) {
        return next(new APIError("Invalid token (refresh).", 403));
      }
    }
  );
  req.user = user;
  next();
});

export default protect;
