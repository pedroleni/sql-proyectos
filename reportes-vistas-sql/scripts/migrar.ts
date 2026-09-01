import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type Database from "better-sqlite3";
import { abrirDb } from "../src/db.js";

const directorioActual = dirname(fileURLToPath(import.meta.url));
const directorioMigraciones = resolve(directorioActual, "../migrations");

export function aplicarMigraciones(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      nombre TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL
    )
  `);

  const aplicadas = new Set(
    (
      db.prepare("SELECT nombre FROM _migraciones").all() as Array<{
        nombre: string;
      }>
    ).map((fila) => fila.nombre),
  );

  const archivos = readdirSync(directorioMigraciones)
    .filter((nombre) => /^\d+_.+\.sql$/.test(nombre))
    .sort();
  const registrar = db.prepare(
    "INSERT INTO _migraciones (nombre, aplicada_en) VALUES (?, ?)",
  );

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;

    const sql = readFileSync(join(directorioMigraciones, archivo), "utf8");
    db.transaction(() => {
      db.exec(sql);
      registrar.run(archivo, new Date().toISOString());
    })();
  }
}

function ejecutarDesdeTerminal(): void {
  const ruta = process.argv[2] ?? "ventas.sqlite";
  const db = abrirDb(ruta);
  try {
    aplicarMigraciones(db);
    console.log(`Migraciones aplicadas en ${ruta}`);
  } finally {
    db.close();
  }
}

const entrada = process.argv[1];
if (entrada && import.meta.url === pathToFileURL(resolve(entrada)).href) {
  ejecutarDesdeTerminal();
}
