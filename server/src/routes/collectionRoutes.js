import { Router } from 'express';
import { getAllCollections, getUserCollection } from '../controllers/collectionControllers';

const router = Router();

router.route('/').get(getAllCollections);
router.route('/:username').get(getUserCollection);

export default router;
