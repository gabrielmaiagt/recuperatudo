import { Request, Response } from 'express';
import { db } from '../lib/firebase';

export class SettingsController {

  // GET /api/settings
  async getSettings(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      const doc = await db.collection('settings').doc('credentials').get();
      if (!doc.exists) {
         // Se não existe, retorna chaves vazias ou o que estiver no .env
         return res.status(200).json({
            resendApiKey: process.env.RESEND_API_KEY || '',
            evolutionUrl: process.env.EVOLUTION_API_URL || '',
            evolutionKey: process.env.EVOLUTION_API_KEY || '',
            emailProvider: 'resend',
            senderName: '',
            senderEmail: ''
         });
      }

      return res.status(200).json(doc.data());
    } catch (error) {
      console.error('❌ Erro ao buscar settings:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // POST /api/settings
  async saveSettings(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      // Aceita qualquer campo enviado pelo front (resendApiKey, evolutionUrl, evolutionKey, etc)
      const data = req.body;

      await db.collection('settings').doc('credentials').set(data, { merge: true });

      return res.status(200).json({ message: 'Configurações salvas com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao salvar settings:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
