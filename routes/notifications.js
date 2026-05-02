import express from 'express';
import { getNotifications, markAllAsRead } from '../controllers/notificationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.put('/read', authMiddleware, markAllAsRead);

export default router;
