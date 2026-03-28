import { Request, Response } from 'express';
import { db } from '../lib/firebase';

export class AutomationController {

  // POST /api/automations
  async createAutomation(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      const { name, gateway, trigger, targetProduct, steps } = req.body;

      if (!name || !gateway || !trigger || !steps || steps.length === 0) {
        return res.status(400).json({ error: 'Faltam campos obrigatórios na Automação.' });
      }

      const autoRef = await db.collection('automations').add({
        name,
        gateway,
        trigger,
        targetProduct: targetProduct || '', // Filtro de Produto
        steps,
        status: 'ACTIVE',
        createdAt: new Date()
      });

      return res.status(201).json({ id: autoRef.id, message: 'Automação criada com sucesso' });
    } catch (error) {
      console.error('❌ Erro ao criar automação:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /api/automations
  async listAutomations(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      const snapshot = await db.collection('automations').orderBy('createdAt', 'desc').get();
      
      const automations = [];
      for (const doc of snapshot.docs) {
        automations.push({ id: doc.id, ...doc.data() });
      }

      return res.status(200).json(automations);
    } catch (error) {
      console.error('❌ Erro ao listar automações:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUT /api/automations/:id/status
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACTIVE' or 'PAUSED'
      
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      await db.collection('automations').doc(id).update({ status });
      return res.status(200).json({ message: 'Status atualizado com sucesso.' });
    } catch (error) {
       console.error('❌ Erro ao atualizar automação:', error);
       return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // DELETE /api/automations/:id
  async deleteAutomation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      await db.collection('automations').doc(id).delete();
      return res.status(200).json({ message: 'Automação deletada com sucesso.' });
    } catch (error) {
       console.error('❌ Erro ao deletar automação:', error);
       return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

}
