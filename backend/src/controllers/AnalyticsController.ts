import { Request, Response } from 'express';
import { db } from '../lib/firebase';

export class AnalyticsController {
  // GET /api/analytics
  async getDashboardData(req: Request, res: Response) {
    try {
      if (!db) return res.status(500).json({ error: 'Database not initialized' });

      const now = new Date();
      // Limite de 7 dias para o gráfico
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      // --- Mapear Arrays ---
      const webhooksSnap = await db.collection('webhook_logs').where('createdAt', '>=', sevenDaysAgo).get();
      const schedulesSnap = await db.collection('scheduled_messages').where('sendAt', '>=', sevenDaysAgo).get();

      // Métricas Básicas Globais
      let totalWebhooks = 0;
      let totalPaidOrganically = 0;
      let totalAbandonedOrRefused = 0;

      let revenueOrganically = 0;
      let revenueLost = 0;

      // Histórico Diário (Gráfico de 7 dias)
      const chartMap: Record<string, { date: string, webhooks: number, msgs: number, emails: number }> = {};
      
      // Popular chartMap com chaves zeradas
      for (let i = 0; i < 7; i++) {
         const d = new Date(sevenDaysAgo);
         d.setDate(d.getDate() + i);
         const key = d.toLocaleDateString('pt-BR', { weekday: 'short' }); // Seg, Ter, Qua
         chartMap[key] = { date: key.charAt(0).toUpperCase() + key.slice(1), webhooks: 0, msgs: 0, emails: 0 };
      }

      const getDayKey = (dateProto: any) => {
         if (!dateProto || !dateProto.toDate) return null;
         const d = dateProto.toDate();
         const k = d.toLocaleDateString('pt-BR', { weekday: 'short' });
         return k.charAt(0).toUpperCase() + k.slice(1);
      };

      // RecActivities (Tempo real fake/latest logs)
      const activities: any[] = [];

      webhooksSnap.forEach(doc => {
         const d = doc.data();
         totalWebhooks++;
         
         const rawValue = d.value ? parseFloat(d.value.toString().replace(',', '.')) : 0;
         const safeValue = isNaN(rawValue) ? 0 : rawValue;

         if (d.standardEvent === 'approved') {
             totalPaidOrganically++;
             revenueOrganically += safeValue;
         }
         if (['abandonment', 'refused'].includes(d.standardEvent)) {
             totalAbandonedOrRefused++;
             revenueLost += safeValue;
         }

         const dayKey = getDayKey(d.createdAt);
         if (dayKey && chartMap[dayKey]) chartMap[dayKey].webhooks++;

         activities.push({
            id: doc.id,
            rawDate: d.createdAt ? d.createdAt.toDate() : new Date(),
            type: "webhook",
            title: `Log Recebido Oculto`,
            subtitle: `Sinal da Plataforma de Pagamento`,
            color: "text-purple-500"
         });
      });

      let wppSent = 0;
      let emailSent = 0;
      let totalRecoveredWpp = 0; // Idealmente a gente trackearia venda recuperada atribuída
      let totalRecoveredEmail = 0;

      schedulesSnap.forEach(doc => {
         const d = doc.data();
         if (d.status === 'DELIVERED') {
            const dayKey = getDayKey(d.sendAt);
            if (d.type === 'whatsapp') {
               wppSent++;
               if (dayKey && chartMap[dayKey]) chartMap[dayKey].msgs++;
            }
            if (d.type === 'email') {
               emailSent++;
               if (dayKey && chartMap[dayKey]) chartMap[dayKey].emails++;
            }

            activities.push({
                id: doc.id,
                rawDate: d.sendAt ? d.sendAt.toDate() : new Date(),
                type: d.type || "email",
                title: `${d.type === 'whatsapp' ? 'Mensagem' : 'E-mail'} finalizado`,
                subtitle: `Para o circuito do cliente`,
                color: d.type === 'whatsapp' ? "text-green-500" : "text-blue-500"
             });
         }
      });

      // Ordenar e pegar as 5 ultimas atividades
      activities.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
      const recentActivities = activities.slice(0, 5).map(a => ({
         ...a,
         time: a.rawDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }));

      // Chart array format
      const chartData = Object.values(chartMap);

      // Calculando Taxa
      let recoveryRate = 0;
      // Para saber quantos Leads foram recuperados REALMENTE, precisaremos no futuro:
      // De um histórico que mapeie um webhook "approved" cruzando com o email/telefone de um cara que teve um "abandonment" a tempos atrás.
      // Por enquanto, isso precisa começar em ZERO!
      const estimateRecovered = 0;
      if (totalAbandonedOrRefused > 0) {
          recoveryRate = parseFloat(((estimateRecovered / totalAbandonedOrRefused) * 100).toFixed(1));
      }

      res.status(200).json({
        metrics: {
           webhooks: totalWebhooks,
           whatsappSent: wppSent,
           emailsSent: emailSent,
           recoveryRate: recoveryRate
        },
        chartData,
        funnel: {
           total: totalWebhooks,
           paidOrganically: totalPaidOrganically,
           enteredRecovery: totalAbandonedOrRefused,
           recoveredWpp: estimateRecovered, // placeholder do BI
           recoveredEmail: 0,
           lost: (totalAbandonedOrRefused - estimateRecovered) > 0 ? (totalAbandonedOrRefused - estimateRecovered) : 0,
           upsellSent: 0,
           upsellConverted: 0
        },
        revenue: {
           organically: revenueOrganically,
           recovered: 0, // estimateRecovered * midTicket no futuro
           lost: revenueLost
        },
        activities: recentActivities
      });
      
    } catch (error) {
      console.error('❌ Erro no Analytics:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
