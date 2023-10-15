import { Router } from 'express';
import protect from '../helpers/protect';
import { deleteTrade, getAllTrades, postNewTrade } from '../controllers/tradeControllers';

const router = Router();

router.route('/').get(getAllTrades).post(protect, postNewTrade).delete(protect, deleteTrade);
// router.route('/:trade_id');

export default router;
