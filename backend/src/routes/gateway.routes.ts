import { Router } from 'express';
import { GatewayController } from '../controllers/GatewayController';

const router = Router();
const controller = new GatewayController();

// Create new Gateway
router.post('/', (req, res) => controller.createGateway(req, res));

// List all Gateways
router.get('/', (req, res) => controller.listGateways(req, res));

// Delete Gateway
router.delete('/:id', (req, res) => controller.deleteGateway(req, res));

// Rename Gateway
router.put('/:id', (req, res) => controller.renameGateway(req, res));

export default router;
