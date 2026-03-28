import axios from 'axios';
import { db } from '../lib/firebase';

export async function sendWhatsAppMessage(phone: string, text: string) {
  try {
    let API_URL = process.env.EVOLUTION_API_URL || '';
    let API_KEY = process.env.EVOLUTION_API_KEY || '';

    if (db) {
       try {
         const creds = await db.collection('settings').doc('credentials').get();
         if (creds.exists) {
           const data = creds.data();
           if (data?.evolutionUrl) API_URL = data.evolutionUrl;
           if (data?.evolutionKey) API_KEY = data.evolutionKey;
         }
       } catch (e) {
         console.warn("Falha ao ler Settings de Evolution:", e);
       }
    }

    if (!API_URL || API_URL.trim() === '' || API_URL.includes('localhost:8080')) {
       console.log(`[Mock Mode] 💬 Enviando WhatsApp via Evolution para ${phone}: ${text}`);
       return { status: 'Sent', message: 'Simulated success via Evolution API' };
    }

    console.log(`💬 Enviando WhatsApp REAl via Evolution para ${phone}`);
    const instanceName = "RecuperaPrincipal"; // Idealmente viria das configurações
    
    const response = await axios.post(`${API_URL}/message/sendText/${instanceName}`, {
      number: phone,
      textMessage: {
        text: text
      }
    }, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return response.data;

  } catch (error) {
    console.error(`❌ Falha ao enviar WhatsApp para ${phone}:`, error);
    // Não quebra o loop, só loga o erro
    return { status: 'Failed', error };
  }
}
