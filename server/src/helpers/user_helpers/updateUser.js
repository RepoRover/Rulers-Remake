import User from "../../models/userModel";

const updateUser = async (filter, updateData) => {
  return await User.findOneAndUpdate(filter, updateData, { new: true });
};

export default updateUser;
