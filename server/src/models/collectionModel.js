import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
	collection_id: {
		type: String,
		required: true,
		unique: true
	},
	username: {
		type: String,
		unique: true,
		required: true
	},
	image_path: {
		type: String,
		required: true
	},
	legendary_cards: {
		type: Number,
		required: true
	},
	epic_cards: {
		type: Number,
		required: true
	},
	rare_cards: {
		type: Number,
		required: true
	},
	cards: {
		type: [String],
		required: true
	},
	created_at: {
		type: Date
	}
});

collectionSchema.pre('save', function (next) {
	if (!this.created_at) {
		this.created_at = new Date();
	}
	next();
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
