import { Request, Response } from 'express';
import { db } from '../lib/firebase';
import { scheduleAutomationFlow, cancelPendingRecoveryMessages } from '../services/SchedulerService';

export class WebhookController {
  async receiveWebhook(req: Request, res: Response) {
    const { gatewayId } = req.params;
    const payload = req.body;

    // Fast response para não dar timeout na BuckPay
    res.status(200).send('Webhook Recebido');

    console.log(`📡 [WEBHOOK RECEBIDO] Gateway: ${gatewayId}`);
    
    // Ignorar requisições vazias de verificação de gateway
    if (!payload || Object.keys(payload).length === 0) return;

    try {
      // 1. Identificar o tipo do evento (BuckPay Mapeamento Exato)
      const realData = payload.data || payload; // A BuckPay joga o corpo inteiro dentro de 'data'
      const eventType = payload.event || realData.status; 
      
      // Mapeamento simples
      let standardEvent = "unknown";
      // Na BuckPay: transaction.created = Pix Pendente/Boleto, começa o ciclo de Recuperação.
      if (['transaction.created', 'cart_abandoned', 'abandonment'].includes(eventType)) standardEvent = "abandonment";
      // Na BuckPay: transaction.processed = Venda foi Paga, começa Entregável/Boas-vindas ou Upsell
      if (['transaction.processed', 'approved', 'paid', 'completed'].includes(eventType)) standardEvent = "approved";
      if (['refused', 'failed', 'canceled'].includes(eventType)) standardEvent = "refused";
      if (['upsell_purchased', 'upsell_approved'].includes(eventType)) standardEvent = "upsell";
      if (['subscription_active'].includes(eventType)) standardEvent = "subscription_active";
      if (['subscription_overdue'].includes(eventType)) standardEvent = "subscription_overdue";

      // 2. Extrair informações do Cliente Baseado no Payload da BuckPay
      const client = realData.buyer || realData.customer || realData;
      const leadData = {
        name: client.name || client.first_name || 'Amigo(a)',
        email: client.email || '',
        phone: client.phone || client.mobile || '',
        product: realData.offer?.name || payload.product?.name || realData.plan_name || 'Produto',
        // Valor vem em centavos na BuckPay (ex: 5275 = R$ 52,75). Dividimos por 100 se vier inteiro.
        value: typeof realData.total_amount === 'number' && realData.total_amount > 1000 ? (realData.total_amount / 100).toFixed(2).replace('.', ',') : (realData.price || 0),
        // Pegaremos o Pix Code bruto pra ele virar link e mandar na hora da recuperação
        access_link: realData.pix_code || realData.access_url || realData.delivery_url || '',
        gatewayId,
      };

      console.log(`🤖 Lead identificado: ${leadData.name} - Evento Padrão: ${standardEvent}`);

      // 3. Salvar mini-recibo (Log) de evento na Tabela de Webhooks do Gateway
      if (db) {
         await db.collection('webhook_logs').add({
            gatewayId,
            standardEvent,
            type: eventType,
            value: leadData.value || '0',
            product: leadData.product || 'Desconhecido',
            createdAt: new Date()
         });
      }

      // 4. Buscar automações amarradas neste Gateway e com este Evento
      if (!db) {
         console.warn("⚠️ Firestore não inicializado, impossível consultar automações. Simulando fluxo...");
         return;
      }

      // NOVO: SISTEMA DE INTERCEPTAÇÃO E CANCELAMENTO (Smart Cancel)
      // Se este evento indica PAGAMENTO BEM-SUCEDIDO (approved/paid), 
      // precisamos matar qualquer automação de Recuperação (abandonment/refused) retida na fila.
      if (standardEvent === 'approved') {
         await cancelPendingRecoveryMessages(
            leadData.email, 
            leadData.phone, 
            gatewayId, 
            leadData.product
         );
      }

      // Procura cadências/automações do evento ATUAL
      const automationsRef = db.collection('automations');
      const snapshot = await automationsRef
        .where('gateway', '==', gatewayId)
        .where('trigger', '==', standardEvent)
        .where('status', '==', 'ACTIVE')
        .get();

      if (snapshot.empty) {
        console.log(`ℹ️ Nenhuma automação ativa para [${standardEvent}] no Gateway [${gatewayId}]. Ignorando.`);
        return;
      }

      // Adicionar lead no banco (Opcionalmente, pra aparecer na Table de Leads)
      const leadRef = await db.collection('leads').add({
        ...leadData,
        status: 'IN_CADENCE',
        createdAt: new Date(),
        gatewayIcon: payload.source || 'BuckPay'
      });

      // 4. Iniciar Agendamentos filtrando pelo Produto
      let matchedCount = 0;
      snapshot.forEach((doc) => {
        const automation = doc.data();

        // Trava Inteligente de Produto
        const incomingProduct = String(leadData.product).trim().toLowerCase();
        const targetProduct = automation.targetProduct ? String(automation.targetProduct).trim().toLowerCase() : "";
        
        // Se a automação exige um produto específico e não bater parcialmente ou integralmente, pula
        if (targetProduct && targetProduct !== "") {
          if (!incomingProduct.includes(targetProduct) && incomingProduct !== targetProduct) {
             console.log(`\u23ed\ufe0f Automação [${automation.name || doc.id}] ignorada. Motivo: Produto não bate. (Esperado: ${targetProduct} | Recebido: ${incomingProduct})`);
             return;
          }
        }

        matchedCount++;
        scheduleAutomationFlow(leadRef.id, leadData, automation);
      });

      if (matchedCount === 0) {
         console.log(`\u2139\ufe0f Nenhuma automação validou o produto '${leadData.product}'.`);
      }

    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
    }
  }
}
