import { Router } from 'express';

import {
	getAllCollections,
	getUserCollection,
	getWholeUserCollection,
	favouriteCollectionToggle
} from '../controllers/collectionControllers.js';
import protect from './../helpers/protect.js';

const router = Router();

router.route('/').get(getAllCollections);
router.route('/:username').get(getUserCollection).patch(protect, favouriteCollectionToggle);

// This route is to get all the cards from the user collection
// use it only when initializing the app
router.route('/all/:username').get(getWholeUserCollection);

export default router;
