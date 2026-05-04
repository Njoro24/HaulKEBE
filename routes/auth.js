import express from 'express';
import multer from 'multer';
import { register, login, getMe, logout } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'truck_photo_1', maxCount: 1 },
  { name: 'truck_photo_2', maxCount: 1 },
  { name: 'truck_photo_3', maxCount: 1 },
  { name: 'id_document', maxCount: 1 },
]), register);

router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

export default router;
