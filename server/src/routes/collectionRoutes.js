import { Router } from 'express';

// eslint-disable-next-line no-unused-vars
import { getAllCollections, getWholeUserCollection } from '../controllers/collectionControllers';

const router = Router();

router.route('/').get(getAllCollections);

// This route is to get all the cards from the user collection
// use it only when initializing the app
router.route('/all/:username').get(getWholeUserCollection);

export default router;
