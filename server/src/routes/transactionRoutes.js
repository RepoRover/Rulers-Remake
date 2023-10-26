import { Router } from 'express';

import { getAllTransactions, getSingleTransaction } from '../controllers/transactionControllers';

const router = Router();

router.route('/').get(getAllTransactions);
router.route('/:transaction_id').get(getSingleTransaction);

export default router;
