import { Router } from 'express';

import { getUserProfile } from './../controllers/profileControllers.js';
import protect from './../helpers/protect.js';

const router = Router();

router.route('/').get(getUserProfile);

export default router;
