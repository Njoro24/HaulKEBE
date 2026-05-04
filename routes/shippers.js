import express from 'express';
import { getProfile, updateProfile, getStats } from '../controllers/shipperController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, roleMiddleware(['shipper']), getProfile);
router.put('/profile', authMiddleware, roleMiddleware(['shipper']), updateProfile);
router.get('/stats', authMiddleware, roleMiddleware(['shipper']), getStats);

export default router;
