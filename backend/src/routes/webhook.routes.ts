import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';

const router = Router();
const webhookController = new WebhookController();

// A Rota principal que as plataformas conectam: /api/webhooks/meu_gateway_id_123
router.post('/:gatewayId', webhookController.receiveWebhook);

export default router;
