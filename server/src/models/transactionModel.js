import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
	transaction_id: {
		type: String,
		required: true,
		unique: true
	},
	trade_id: {
		type: String,
		required: true,
		unique: true
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
	},
	created_at: {
		type: Date
	}
});

transactionSchema.pre('save', function (next) {
	if (!this.created_at) {
		this.created_at = new Date();
	}
	next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
