import { Router } from 'express';

import {
	changeUsername,
	changePassword,
	newAvatar,
	accountDelete,
	deleteAvatar,
	getUser
} from './../controllers/userControllers.js';

import protect from './../helpers/protect.js';
import uploadAvatarMiddleware from '../helpers/uploadAvatarMiddleware.js';

const router = Router();

router.route('/').get(protect, getUser).delete(protect, accountDelete);
router.route('/new-pwd').post(protect, changePassword);
router.route('/new-name').post(protect, changeUsername);
router
	.route('/avatar')
	.put(protect, uploadAvatarMiddleware, newAvatar)
	.delete(protect, deleteAvatar);

export default router;
