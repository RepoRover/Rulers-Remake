import User from "../../models/userModel";

const findUser = async (filter) => {
  return await User.findOne(filter);
};

export default findUser;
