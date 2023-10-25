import { Router } from 'express';
import { getAllHeros } from '../controllers/heroControllers';

const router = Router();

router.route('/').get(getAllHeros);

export default router;
