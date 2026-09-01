import Database from "better-sqlite3";

/** Abre una conexión SQLite y activa la validación de claves foráneas. */
export function abrirDb(ruta: string): Database.Database {
  const db = new Database(ruta);
  db.pragma("foreign_keys = ON");
  return db;
}
