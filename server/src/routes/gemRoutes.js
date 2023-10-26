import { Router } from 'express';

import protect from './../helpers/protect.js';
import { getAllGemSets, purchaseGemSet } from '../controllers/gemControllers.js';

const router = Router();

router.route('/').get(getAllGemSets);
router.route('/gem_set_id').post(protect, purchaseGemSet);
