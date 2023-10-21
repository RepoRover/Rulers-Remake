import { Router } from 'express';
import protect from '../helpers/protect.js';
import {
	deleteTrade,
	getAllTrades,
	postNewTrade,
	executeTrade
} from '../controllers/tradeControllers.js';

import { validateTrade } from './../helpers/trade_helpers/validateTrade.js';

const router = Router();

router.route('/').get(getAllTrades).post(protect, validateTrade, postNewTrade);
router.route('/:trade_id').post(protect, executeTrade).delete(protect, deleteTrade);

export default router;
