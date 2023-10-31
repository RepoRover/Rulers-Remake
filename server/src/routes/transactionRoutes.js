import { Router } from 'express';

import {
	getUserTransactions,
	getSingleTransaction
} from '../controllers/transactionControllers.js';

const router = Router();

router.route('/user/:username').get(getUserTransactions);
router.route('/:transaction_id').get(getSingleTransaction);

export default router;
