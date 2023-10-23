import { Router } from 'express';

import {
	changeUsername,
	changePassword,
	newAvatar,
	accountDelete,
	deleteAvatar
} from './../controllers/userControllers.js';

import protect from './../helpers/protect.js';

const router = Router();

router.route('/').get().delete(protect, accountDelete);
router.route('/new-pwd').post(protect, changePassword);
router.route('/new-name').post(protect, changeUsername);
router.route('/avatar').post(protect, newAvatar).delete(protect, deleteAvatar);

export default router;
