import { Request, Response } from 'express';
import { db } from '../lib/firebase';

export class LeadController {

  // GET /api/leads
  async listLeads(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      // Buscar leads
      const snapshot = await db.collection('leads').orderBy('createdAt', 'desc').get();
      
      const leads = [];
      for (const doc of snapshot.docs) {
        let lData = doc.data();

        // Buscar histórico de execuções para o lead (Aquelas tasks em SchedulerService)
        // Isso ficaria para um tracking avançado, mas por enquanto, mandamos simulado se não houver
        // Precisamos formatar data humanizada
        let dateString = "agora";
        if (lData.createdAt && lData.createdAt.toDate) {
            const dt = lData.createdAt.toDate();
            dateString = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        // Recuperar Gateway Name
        let gatewayName = lData.gatewayId;
        try {
            const gwDoc = await db.collection('gateways').doc(String(lData.gatewayId)).get();
            if (gwDoc.exists) gatewayName = gwDoc.data()?.name || lData.gatewayId;
        } catch(e) {}

        const item = { 
            id: doc.id, 
            name: lData.name || 'Sem nome', 
            email: lData.email || 'Sem e-mail', 
            phone: lData.phone || '-', 
            product: lData.product || 'Produto', 
            value: `R$ ${lData.value || '0,00'}`, 
            gateway: gatewayName, 
            date: dateString, 
            status: lData.status || 'IN_CADENCE', 
            nextDispatch: "-", 
            history: [{ type: "webhook", date: dateString, title: "Lead Capturado na Base" }],
            webhookData: lData
        };

        leads.push(item);
      }

      return res.status(200).json(leads);
    } catch (error) {
      console.error('❌ Erro ao listar leads:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
