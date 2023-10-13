import mongoose from 'mongoose';

const heroModel = new mongoose.Schema({
	hero_id: {
		type: String,
		required: true,
		unique: true
	},
	name: {
		type: String,
		required: true,
		unique: true
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
		required: true,
		unique: true
	},
	back_image_path: {
		type: String,
		required: true,
		unique: true
	}
});

const Hero = mongoose.model('Hero', heroModel);

export default Hero;
