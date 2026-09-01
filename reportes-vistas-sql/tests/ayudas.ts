import type Database from "better-sqlite3";
import { aplicarMigraciones } from "../scripts/migrar.js";
import { abrirDb } from "../src/db.js";

export function dbDePrueba(): Database.Database {
  const db = abrirDb(":memory:");
  aplicarMigraciones(db);
  return db;
}

export function insertarCliente(db: Database.Database, nombre = "Cliente"): number {
  return Number(
    db.prepare("INSERT INTO clientes (nombre) VALUES (?)").run(nombre)
      .lastInsertRowid,
  );
}

export function insertarProducto(
  db: Database.Database,
  nombre: string,
  precio: number,
): number {
  return Number(
    db.prepare("INSERT INTO productos (nombre, precio) VALUES (?, ?)").run(
      nombre,
      precio,
    ).lastInsertRowid,
  );
}
