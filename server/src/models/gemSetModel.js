import mongoose from 'mongoose';

const gemSetSchema = new mongoose.Schema({
	gem_set_id: {
		type: String,
		required: true,
		unique: true
	},
	image_path: {
		type: String,
		required: true
	},
	gem_amount: {
		type: Number,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	available: {
		type: Boolean,
		required: true
	}
});

const GemSet = mongoose.model('gemSet', gemSetSchema);

export default GemSet;
