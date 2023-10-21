import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
	card_id: {
		type: String,
		required: true,
		unique: true
	},
	hero_id: {
		type: String,
		required: true
	},
	card_owner: {
		type: Object,
		required: true
	},
	in_sale: {
		type: Boolean,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	rarity: {
		type: String,
		required: true
	},
	role: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	front_image_path: {
		type: String,
		required: true
	},
	back_image_path: {
		type: String,
		required: true
	},
	hero_link: {
		type: String,
		required: true
	}
});

const Card = mongoose.model('Card', cardSchema);

export default Card;
