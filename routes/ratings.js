import express from 'express';
import { submitRating, getUserRatings } from '../controllers/ratingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, submitRating);
router.get('/:userId', getUserRatings);

export default router;
