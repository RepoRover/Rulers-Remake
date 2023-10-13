import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
	user_id: {
		type: String,
		required: true,
		unique: true
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	cards: {
		type: [String],
		required: true
	}
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
