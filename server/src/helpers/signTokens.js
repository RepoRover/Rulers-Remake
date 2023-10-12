import jwt from "jsonwebtoken";

const signTokens = (user_id) => {
  const rndm = Math.random().toFixed(6) * 1000000;
  const accessToken = jwt.sign(
    { user_id, rndm },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_TTL,
    }
  );
  const refreshToken = jwt.sign(
    { user_id, rndm },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_TTL,
    }
  );
  return { accessToken, refreshToken };
};

export default signTokens;
