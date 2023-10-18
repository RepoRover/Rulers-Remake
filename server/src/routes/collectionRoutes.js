import { Router } from 'express';

import {
	getAllCollections,
	getUserCollection,
	getWholeUserCollection
} from '../controllers/collectionControllers.js';

const router = Router();

router.route('/').get(getAllCollections);
router.route('/:username').get(getUserCollection);

// This route is to get all the cards from the user collection
// use it only when initializing the app
router.route('/all/:username').get(getWholeUserCollection);

export default router;
