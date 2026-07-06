import express from 'express';
import {
  createHomeVisit,
  getAllHomeVisits,
  getHomeVisitById,
  updateHomeVisit,
  deleteHomeVisit,
  getUserHomeVisits,
  rejectHomeVisitsByForm
} from '../controllers/homeVisitController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getAllHomeVisits);
router.get('/my-visits', getUserHomeVisits);
router.post('/', createHomeVisit);

router.put('/by-form/:formId/reject', rejectHomeVisitsByForm);

// User accepts/rejects scheduled visit
router.patch('/:id/respond', updateHomeVisit);

router.get('/:id', getHomeVisitById);
router.put('/:id', updateHomeVisit);
router.delete('/:id', deleteHomeVisit);

export default router;