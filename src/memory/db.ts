import Database from 'better-sqlite3';
import { config } from '../config.js';
import path from 'path';
import fs from 'fs';

// Asegurarse de que el directorio de la base de datos exista
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.DB_PATH);

// Crear tabla de mensajes si no existe
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export interface MessageRow {
  id?: number;
  userId: number;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: string;
}

export const memory = {
  addMessage: async (userId: number, role: 'user' | 'assistant' | 'system' | 'tool', content: string) => {
    const stmt = db.prepare(
      'INSERT INTO messages (userId, role, content, createdAt) VALUES (?, ?, ?, ?)'
    );
    stmt.run(userId, role, content, new Date().toISOString());
  },

  getMessages: async (userId: number, limitCount?: number): Promise<MessageRow[]> => {
    let stmt;
    if (limitCount) {
      stmt = db.prepare(
        'SELECT * FROM messages WHERE userId = ? ORDER BY id DESC LIMIT ?'
      );
      const rows = stmt.all(userId, limitCount) as MessageRow[];
      return rows.reverse();
    } else {
      stmt = db.prepare(
        'SELECT * FROM messages WHERE userId = ? ORDER BY id ASC'
      );
      return stmt.all(userId) as MessageRow[];
    }
  },

  clearMemory: async (userId: number) => {
    const stmt = db.prepare('DELETE FROM messages WHERE userId = ?');
    stmt.run(userId);
  }
};
