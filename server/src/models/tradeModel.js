import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
	trade_id: {
		type: String,
		required: true,
		unique: true
	},
	metadata: {
		type: [String],
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
		type: mongoose.Schema.Types.Mixed,
		required: true,
		validate: {
			validator: function (v) {
				return Array.isArray(v) || typeof v === 'number';
			},
			message: (props) => `${props.value} should be either an array or a number.`
		}
	},
	give_gems: {
		type: Boolean,
		required: true
	},
	take: {
		type: mongoose.Schema.Types.Mixed,
		required: true,
		validate: {
			validator: function (v) {
				return Array.isArray(v) || typeof v === 'number';
			},
			message: (props) => `${props.value} should be either an array or a number.`
		}
	},
	take_gems: {
		type: Boolean,
		required: true
	}
});

const Trade = mongoose.model('Trade', tradeSchema);

export default Trade;
