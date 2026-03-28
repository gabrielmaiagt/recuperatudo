import { Resend } from 'resend';
import { db } from '../lib/firebase';

// Variáveis de ambiente serão lidas de forma lazy após a execução de dotenv.config()
let resend: Resend | null = null;

/**
 * Dispara um e-mail utilizando a API da Resend.
 * @param to E-mail de destino (Lead)
 * @param subject Assunto do e-mail
 * @param htmlBody Corpo em HTML já processado com as variáveis do Lead
 */
export async function sendRecoveryEmail(to: string, subject: string, htmlBody: string) {
  // 1. Busca credenciais ativas do banco
  let API_KEY = process.env.RESEND_API_KEY || ''; // Fallback
  let senderName = 'RecuperaTudo';
  let senderEmail = 'onboarding@resend.dev';

  if (db) {
     try {
       const creds = await db.collection('settings').doc('credentials').get();
       if (creds.exists) {
         const data = creds.data();
         if (data?.resendApiKey) API_KEY = data.resendApiKey;
         if (data?.senderName) senderName = data.senderName;
         if (data?.senderEmail) senderEmail = data.senderEmail;
       }
     } catch (e) {
       console.warn("Falha ao ler Settings de Email:", e);
     }
  }

  if (!API_KEY || API_KEY.trim() === '') {
    console.warn(`[Mock Mode] 📧 E-mail falso para ${to}: (Chave da Resend não configurada)`);
    return;
  }
  
  if (!resend) resend = new Resend(API_KEY);
  else resend = new Resend(API_KEY); // Atualizar caso a chave tenha mudado no banco

  try {
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [to],
      subject: subject,
      html: htmlBody,
    });

    if (error) {
      console.error('❌ Erro da Resend API ao enviar e-mail:', error);
      return;
    }

    console.log(`✅ E-mail disparado via Resend para [${to}] - ID: ${data?.id}`);
  } catch (err) {
    console.error('❌ Erro catastrófico ao despachar e-mail via Resend:', err);
  }
}
