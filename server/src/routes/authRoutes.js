import { Router } from 'express';
import {
	login,
	signup,
	checkUserNameAndPwd,
	logoutAll,
	refresh,
	changePassword,
	changeUsername
} from './../controllers/authControllers.js';
import protect from '../helpers/protect.js';

const router = Router();

router.route('/login').post(checkUserNameAndPwd, login);
router.route('/signup').post(checkUserNameAndPwd, signup);
router.route('/refresh').post(protect, refresh);
router.route('/logout-all').post(protect, logoutAll);
router.route('/new-pwd').post(protect, changePassword);
router.route('/new-name').post(protect, changeUsername);

export default router;
