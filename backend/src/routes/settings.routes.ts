import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';

const router = Router();
const controller = new SettingsController();

router.get('/', (req, res) => controller.getSettings(req, res));
router.post('/', (req, res) => controller.saveSettings(req, res));

export default router;
