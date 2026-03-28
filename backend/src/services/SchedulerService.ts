import { db } from '../lib/firebase';
import { sendWhatsAppMessage } from './EvolutionService';
import { sendRecoveryEmail } from './EmailService';

/**
 * Agendamento Inicial - Pega o payload e joga no Firestore 
 * numa coleção de "filas" (queue) com o tempo exato para envio.
 */
export async function scheduleAutomationFlow(leadId: string, leadData: any, automationData: any) {
  if (!db) return;

  const now = new Date();
  const queueRef = db.collection('scheduled_messages');

  // Variáveis para substituir no texto
  const mapVars = {
    '{{nome}}': leadData.name,
    '{{primeiro_nome}}': leadData.name.split(' ')[0],
    '{{produto}}': leadData.product,
    '{{valor}}': leadData.value,
    '{{link_acesso}}': leadData.access_link,
    '{{email_cliente}}': leadData.email,
  };

  for (const step of automationData.steps) {
    let delayMs = 0;
    
    // Converte o "delay" da UI em milissegundos
    if (step.delay === 'imediato') delayMs = 1000; 
    else if (step.delay === '15m') delayMs = 15 * 60 * 1000;
    else if (step.delay === '1h') delayMs = 60 * 60 * 1000;
    else if (step.delay === '24h') delayMs = 24 * 60 * 60 * 1000;
    // Expansão do usuário (ex: Upsell 1 min, Recorrência 1 semana)
    else if (step.delay === '1m') delayMs = 60 * 1000;
    else if (step.delay === '7d' || step.delay === '1w') delayMs = 7 * 24 * 60 * 60 * 1000;

    const scheduledTime = new Date(now.getTime() + delayMs);

    // Substitui variáveis
    let parsedMessage = step.message;
    for (const [key, value] of Object.entries(mapVars)) {
      parsedMessage = parsedMessage.replace(new RegExp(key, 'g'), value);
    }

    await queueRef.add({
      leadId,
      status: 'WAITING',
      type: step.type, // 'whatsapp' ou 'email'
      sendAt: scheduledTime,
      message: parsedMessage,
      phone: leadData.phone || '',
      email: leadData.email || '',
      instanceId: step.instanceId || 'global',
      gatewayId: leadData.gatewayId || '',
      product: String(leadData.product).trim().toLowerCase(),
      trigger: automationData.trigger || 'unknown',
    });

    console.log(`⏱️ Mensagem agendada para ${leadData.name} em ${scheduledTime.toLocaleString()}`);
  }
}

/**
 * Engine Polling: Verifica o banco de dados a cada X segundos 
 * para enviar as mensagens cujo tempo `sendAt` já chegou.
 */
export function initializeScheduler() {
  console.log('⏳ Engine de Eventos & Agendamentos Iniciada');
  
  if (!db) {
    console.warn("Nenhum banco de dados conectado, simulador em pausa.");
    return;
  }

  setInterval(async () => {
    try {
      const now = new Date();
      if (!db) return;
      
      const snapshot = await db.collection('scheduled_messages')
        .where('status', '==', 'WAITING')
        .where('sendAt', '<=', now)
        .get();

      if (snapshot.empty) return;

      for (const doc of snapshot.docs) {
        const payload = doc.data();

        // Bloqueia registro pra ngm pegar junto
        await doc.ref.update({ status: 'PROCESSING' });

        if (payload.type === 'whatsapp') {
          // Dispara pra Evolution API
          await sendWhatsAppMessage(payload.phone, payload.message);
        } else if (payload.type === 'email') {
          // Dispara para E-mail via API Resend
          const subject = payload.subject || "Aviso sobre o seu pedido";
          await sendRecoveryEmail(payload.email, subject, payload.message);
        }

        // Concluído
        await doc.ref.update({ status: 'DELIVERED', deliveredAt: new Date() });
      }

    } catch (error) {
      console.error('❌ Erro no Polling Engine:', error);
    }
  }, 30000); // Roda a cada 30 segundos
}

/**
 * Intercepta e Cancela Mensagens de Recuperação Pendentes
 * Chamado quando um evento do tipo 'approved' acontece.
 */
export async function cancelPendingRecoveryMessages(email: string, phone: string, gatewayId: string, product: string) {
  if (!db) return;

  const targetProduct = String(product).trim().toLowerCase();
  
  if (!email && !phone) return; // Precisa de identificação de contato

  try {
    const queueRef = db.collection('scheduled_messages');
    let queries = [];

    // O status é WAITING, e o trigger é either abandonment or refused.
    if (email) {
      queries.push(
        queueRef
          .where('email', '==', email)
          .where('status', '==', 'WAITING')
          .where('trigger', 'in', ['abandonment', 'refused'])
          .get()
      );
    }
    
    if (phone) {
      queries.push(
        queueRef
          .where('phone', '==', phone)
          .where('status', '==', 'WAITING')
          .where('trigger', 'in', ['abandonment', 'refused'])
          .get()
      );
    }

    const results = await Promise.all(queries);
    let canceledCount = 0;
    // Set evita cancelar o mesmo id duas vezes se achar pelo phone E email
    const canceledIds = new Set();

    for (const snapshot of results) {
       for (const doc of snapshot.docs) {
          if (canceledIds.has(doc.id)) continue;

          const data = doc.data();
          // Validação extra cruzada: Confirma ser do mesmo projeto e gateway
          if (data.gatewayId === gatewayId && data.product === targetProduct) {
             await doc.ref.update({ status: 'CANCELED', canceledReason: 'User paid transaction quickly' });
             canceledIds.add(doc.id);
             canceledCount++;
          }
       }
    }

    if (canceledCount > 0) {
      console.log(`\uD83D\uDED1 [SYSTEM] ${canceledCount} mensagem(ns) de recuperação foram CANCELADAS para [${email || phone}] no Gateway ${gatewayId} (Produto: ${targetProduct}). Motivo: Pix/Boleto pago a tempo!`);
    }
  } catch (error) {
    console.error('❌ Erro no interceptador de cancelamento:', error);
  }
}
