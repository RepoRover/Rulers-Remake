import { Router } from 'express';

import { toggleFavouriteCard } from './../controllers/cardControllers.js';
import protect from './../helpers/protect.js';

const router = Router();

router.route('/:card_id').patch(toggleFavouriteCard);

export default router;
