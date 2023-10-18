import { Router } from 'express';
import protect from '../helpers/protect.js';
import { deleteTrade, getAllTrades, postNewTrade } from '../controllers/tradeControllers.js';

const router = Router();

router.route('/').get(getAllTrades).post(protect, postNewTrade).delete(protect, deleteTrade);
// router.route('/:trade_id');

export default router;
