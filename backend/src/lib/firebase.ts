import * as admin from 'firebase-admin';
import path from 'path';

// O usuário deverá colocar o arquivo baixado na raiz do backend
const serviceAccountPath = path.resolve(__dirname, '../../firebase-adminsdk.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
  console.log('✅ Conexão segura com Firebase Firestore estabelecida!');
} catch (error) {
  console.warn('⚠️ Erro ao inicializar o Firebase. Certifique-se de ter colado o firebase-adminsdk.json na pasta "backend".', error);
}

export const db = admin.apps.length ? admin.firestore() : null;
