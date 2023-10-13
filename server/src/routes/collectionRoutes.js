import { Router } from 'express';
import { getAllCollections } from '../controllers/collectionControllers';

const router = Router();

router.route('/').get(getAllCollections);

export default router;
