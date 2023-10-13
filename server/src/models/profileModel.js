import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
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
	gems: {
		type: Number,
		required: true
	},
	image_path: {
		type: String,
		required: true
	},
	free_gem_sets: {
		type: Number,
		required: true
	},
	favourite_trades: {
		type: [String],
		required: true
	},
	favourite_collections: {
		type: [String],
		required: true
	},
	favourite_cards: {
		type: [String],
		required: true
	}
});

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;
