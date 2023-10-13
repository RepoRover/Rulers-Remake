import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
	card_id: {
		type: String,
		required: true,
		unique: true
	},
	card_owner: {
		user_id: {
			type: String,
			required: true,
			unique: true
		},
		username: {
			type: String,
			required: true,
			unique: true
		}
	},
	hero_id: {
		type: String,
		required: true
	}
});

const Card = mongoose.model('Card', cardSchema);

export default Card;
