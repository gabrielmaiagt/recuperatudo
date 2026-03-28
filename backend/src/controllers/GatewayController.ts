import { Request, Response } from 'express';
import { db } from '../lib/firebase';

export class GatewayController {
  
  // POST /api/gateways
  async createGateway(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      const { name, type } = req.body;

      if (!name || !type) {
        return res.status(400).json({ error: 'Nome e Tipo são obrigatórios.' });
      }

      // Cria um ID oficial e persistente no banco
      const gatewayRef = await db.collection('gateways').add({
        name,
        type, // p.ex: "BuckPay", "Kiwify"
        status: 'ACTIVE',
        createdAt: new Date()
      });

      // Cria a URL Dinâmica
      const webhookUrl = `http://localhost:3333/api/webhooks/${gatewayRef.id}`;

      // Salva a URL Oficial de volta no documento
      await gatewayRef.update({ url: webhookUrl });

      return res.status(201).json({ id: gatewayRef.id, name, type, status: 'ACTIVE', url: webhookUrl, recent: [] });
    } catch (error) {
      console.error('❌ Erro ao criar gateway:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // GET /api/gateways
  async listGateways(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      const snapshot = await db.collection('gateways').orderBy('createdAt', 'desc').get();
      
      const gateways = [];
      for (const doc of snapshot.docs) {
        const item = { id: doc.id, ...doc.data(), recent: [] as any[] };

        // BUSCAR LOGS REAIS COM LIMITE DE 5 (Os famigerados "Últimos Eventos")
        let recent: any[] = [];
        try {
          const logsSnapshot = await db.collection('webhook_logs')
              .where('gatewayId', '==', doc.id)
              // .orderBy('createdAt', 'desc') // Descomente apenas depois que Firebase gerar o Index composto
              .limit(5)
              .get();

          recent = logsSnapshot.docs.map(log => {
            const lData = log.data();
            let timeString = "agora";
            if (lData.createdAt && lData.createdAt.toDate) {
               timeString = lData.createdAt.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }
            return {
               type: lData.standardEvent === 'approved' ? 'Pagamento' : (lData.standardEvent === 'abandonment' ? 'Abandono' : lData.standardEvent),
               value: (lData.value === '0' || !lData.value) ? '' : `R$ ${lData.value}`, 
               time: timeString
            };
          });
        } catch (idxError: any) {
           console.warn(`[Index Missing] Ignorando logs para Gateway ${doc.id} temporariamente. Crie o Índice Composto no Firebase.`, idxError.message);
        }

        item.recent = recent;
        gateways.push(item);
      }

      return res.status(200).json(gateways);
    } catch (error) {
      console.error('❌ Erro ao listar gateways:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // DELETE /api/gateways/:id
  async deleteGateway(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      await db.collection('gateways').doc(id).delete();
      return res.status(200).json({ message: 'Gateway deletado com sucesso.' });
    } catch (error) {
       console.error('❌ Erro ao deletar gateway:', error);
       return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // PUT /api/gateways/:id
  async renameGateway(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

      await db.collection('gateways').doc(id).update({ name });
      return res.status(200).json({ message: 'Gateway atualizado com sucesso.' });
    } catch (error) {
       console.error('❌ Erro ao renomear gateway:', error);
       return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

}
