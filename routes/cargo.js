import express from 'express';
import { postCargo, getAllCargo, getCargoById, updateCargo, deleteCargo } from '../controllers/cargoController.js';
import { authMiddleware, roleMiddleware } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['shipper']), upload.array('photos', 4), postCargo);
router.get('/', getAllCargo);
router.get('/:id', getCargoById);
router.put('/:id', authMiddleware, roleMiddleware(['shipper']), updateCargo);
router.delete('/:id', authMiddleware, roleMiddleware(['shipper']), deleteCargo);

export default router;
