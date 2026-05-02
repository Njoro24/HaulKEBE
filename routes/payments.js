import express from 'express';
import { initiateMpesa, mpesaCallback, chargeCard, releaseEscrow } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/mpesa/initiate', authMiddleware, initiateMpesa);
router.post('/mpesa/callback', mpesaCallback);
router.post('/card', authMiddleware, chargeCard);
router.post('/release', authMiddleware, releaseEscrow);

export default router;
