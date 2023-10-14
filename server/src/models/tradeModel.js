import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
	trade_id: {
		type: String,
		required: true,
		unique: true
	},
	trade_status: {
		type: String,
		required: true
	},
	trade_owner: {
		type: Object,
		required: true
	},
	trade_accepter: {
		type: Object,
		required: true
	},
	give: {
		type: Array || Number,
		required: true
	},
	give_gems: {
		type: Boolean,
		required: true
	},
	take: {
		type: Array || Number,
		required: true
	},
	take_gems: {
		type: Boolean,
		required: true
	}
});

const Trade = mongoose.model('Trade', tradeSchema);

export default Trade;
