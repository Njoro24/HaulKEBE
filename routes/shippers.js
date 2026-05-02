import express from 'express';
import { getProfile, updateProfile } from '../controllers/shipperController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, roleMiddleware(['shipper']), getProfile);
router.put('/profile', authMiddleware, roleMiddleware(['shipper']), updateProfile);

export default router;
