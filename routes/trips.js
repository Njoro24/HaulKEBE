import express from 'express';
import { acceptCargo, getMyTrips, getTripById, updateTripStatus } from '../controllers/tripController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, acceptCargo);
router.get('/my', authMiddleware, getMyTrips);
router.get('/:id', authMiddleware, getTripById);
router.put('/:id/status', authMiddleware, updateTripStatus);

export default router;
