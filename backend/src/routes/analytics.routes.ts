import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();
const controller = new AnalyticsController();

router.get('/', (req, res) => controller.getDashboardData(req, res));

export default router;
