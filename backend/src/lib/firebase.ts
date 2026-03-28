import * as admin from 'firebase-admin';
import path from 'path';

// O usuário deverá colocar o arquivo baixado na raiz do backend em dev local
const serviceAccountPath = path.resolve(__dirname, '../../firebase-adminsdk.json');

try {
  let credentialParams;

  // Em produção (Vercel/Render), a chave virá de uma variável de ambiente base64
  if (process.env.FIREBASE_BASE64) {
    const buff = Buffer.from(process.env.FIREBASE_BASE64, 'base64');
    const serviceAccountObj = JSON.parse(buff.toString('utf-8'));
    credentialParams = admin.credential.cert(serviceAccountObj);
    console.log('☁️ Conexão com Firebase via Variável de Ambiente Base64');
  } else {
    // Fallback: modo desenvolvedor ou arquivo manual
    credentialParams = admin.credential.cert(serviceAccountPath);
    console.log('💻 Conexão com Firebase via arquivo local firebase-adminsdk.json');
  }

  admin.initializeApp({
    credential: credentialParams,
  });
  console.log('✅ Banco de Dados Montado Seguro!');
} catch (error) {
  console.warn('⚠️ Erro ao inicializar o Firebase. Falta o arquivo JSON ou a variável FIREBASE_BASE64.', error);
}

export const db = admin.apps.length ? admin.firestore() : null;
