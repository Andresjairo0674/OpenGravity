import admin from 'firebase-admin';
import { config } from '../config.js';

// Inicializar Firebase Admin SDK (Usa internamente la variable de entorno GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

export const db = admin.firestore();

export interface MessageRow {
  id?: string;
  userId: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: string | number;
}

export const memory = {
  addMessage: async (userId: number, role: 'user' | 'assistant' | 'system' | 'tool', content: string) => {
    const messagesRef = db.collection('messages');
    await messagesRef.add({
      userId,
      role,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },
  
  getMessages: async (userId: number, limitCount?: number): Promise<MessageRow[]> => {
    let query = db.collection('messages')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc'); // Ordenamos de forma descendente para obtener los más recientes
      
    if (limitCount) {
      query = query.limit(limitCount);
    }

    const snapshot = await query.get();
    
    const rows: MessageRow[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      rows.push({
        id: doc.id,
        userId: data.userId,
        role: data.role,
        content: data.content,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      });
    });
    
    // Retornamos en orden cronológico ascendente (el más viejo primero)
    return rows.reverse();
  },

  clearMemory: async (userId: number) => {
    const snapshot = await db.collection('messages').where('userId', '==', userId).get();
    
    if (snapshot.empty) return;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
};
