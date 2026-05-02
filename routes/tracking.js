import express from 'express';
import { updateLocation, getLocation } from '../controllers/trackingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.put('/:trip_id', authMiddleware, updateLocation);
router.get('/:trip_id', authMiddleware, getLocation);

export default router;
