import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';

const router = Router();
const controller = new AutomationController();

// Create new Automation
router.post('/', (req, res) => controller.createAutomation(req, res));

// List all Automations
router.get('/', (req, res) => controller.listAutomations(req, res));

// Update Automation Status
router.put('/:id/status', (req, res) => controller.updateStatus(req, res));

// Delete Automation
router.delete('/:id', (req, res) => controller.deleteAutomation(req, res));

export default router;
