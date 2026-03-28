import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';

const router = Router();
const controller = new LeadController();

router.get('/', (req, res) => controller.listLeads(req, res));

export default router;
