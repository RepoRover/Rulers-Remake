import Trade from '../../models/tradeModel';
import Card from '../../models/cardModel';
import { v4 } from 'uuid';

const openTrade = async (trade, user) => {
	const tradeId = v4();
	const newTrade = new Trade({
		trade_id: tradeId,
		trade_status: 'open',
		trade_owner: {
			user_id: user.user_id,
			username: user.username
		},
		trade_accepter: {
			user_id: null,
			username: null
		},
		...trade
	});

	const tradeSave = await newTrade.save();

	if (!tradeSave) return false;
	return newTrade.trade_id;
};

const updateInSaleCardStatus = async (cardIdsArray, tradeAction) => {
	const updateInSaleStatus = await Card.updateMany(
		{ card_id: { $in: cardIdsArray } },
		tradeAction === 'open' ? { $set: { in_sale: true } } : { $set: { in_sale: false } }
	);
	if (!updateInSaleStatus) return false;
	return true;
};

export const newTrade = async (trade, user) => {
	if (Array.isArray(trade.give)) {
		const updateInSaleStatus = await updateInSaleCardStatus(trade.give, 'open');
		if (!updateInSaleStatus) return false;

		const tradeId = await openTrade(trade, user);
		if (!tradeId) return false;

		return tradeId;
	}
};
