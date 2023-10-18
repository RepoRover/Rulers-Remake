import User from '../../models/userModel.js';

const findUser = async (filter) => {
	return await User.findOne(filter);
};

export default findUser;
