import Database from 'better-sqlite3';

export function abrirDb(ruta: string): Database.Database {
  const db = new Database(ruta);
  db.pragma('foreign_keys = ON');
  return db;
}

