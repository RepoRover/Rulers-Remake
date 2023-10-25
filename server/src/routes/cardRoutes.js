import { Router } from 'express';

import protect from './../helpers/protect.js';
import { favouriteItem } from '../helpers/itemFavourite';

const router = Router();

router.route('/:card_id').patch(protect, favouriteItem('card'));

export default router;
