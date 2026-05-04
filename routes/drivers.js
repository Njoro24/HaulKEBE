import express from 'express';
import { getProfile, updateProfile, uploadPhotos, getPublicProfile, getStats } from '../controllers/driverController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/profile', authMiddleware, roleMiddleware(['driver']), getProfile);
router.put('/profile', authMiddleware, roleMiddleware(['driver']), updateProfile);
router.post('/photos', authMiddleware, roleMiddleware(['driver']), upload.array('photos', 3), uploadPhotos);
router.get('/stats', authMiddleware, roleMiddleware(['driver']), getStats);
router.get('/:id', getPublicProfile);

export default router;
