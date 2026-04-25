import { Router } from 'express';
import { PlaceController } from '../controllers/PlaceController';
import { placesUpload } from '../middleware/upload';

const router = Router();

router.get('/', PlaceController.getPlaces);
router.get('/:id', PlaceController.getPlaceById);
router.post('/:id/reviews', PlaceController.addReview);
router.post('/', placesUpload.array('images', 3), PlaceController.createPlace);
router.put('/:id', placesUpload.array('images', 3), PlaceController.updatePlace);
router.delete('/:id', PlaceController.deletePlace);

export default router;
