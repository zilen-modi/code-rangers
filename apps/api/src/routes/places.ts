import { Router } from 'express';
import { PlaceController } from '../controllers/PlaceController';
import { placesUpload } from '../middleware/upload';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', PlaceController.getPlaces);
router.get('/:id', PlaceController.getPlaceById);
router.post(
  '/',
  authenticate,
  authorize([Role.HOTEL_MANAGER, Role.ADMIN]),
  placesUpload.array('images', 3),
  PlaceController.createPlace,
);
router.put(
  '/:id',
  authenticate,
  authorize([Role.HOTEL_MANAGER, Role.ADMIN]),
  placesUpload.array('images', 3),
  PlaceController.updatePlace,
);
router.delete(
  '/:id',
  authenticate,
  authorize([Role.HOTEL_MANAGER, Role.ADMIN]),
  PlaceController.deletePlace,
);

export default router;
