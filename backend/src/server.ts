import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webhookRoutes from './routes/webhook.routes';
import gatewayRoutes from './routes/gateway.routes';
import automationRoutes from './routes/automation.routes';
import leadRoutes from './routes/lead.routes';
import settingsRoutes from './routes/settings.routes';
import analyticsRoutes from './routes/analytics.routes';
import { initializeScheduler } from './services/SchedulerService';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/webhooks', webhookRoutes);
app.use('/api/gateways', gatewayRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'RecuperaTudo Backend is running' });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  // Inicia o motor de polling (Agendador de mensagens atrasadas)
  initializeScheduler();
});
