import { readdirSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";
import { abrirDb } from "../src/db.js";

const directorioMigraciones = fileURLToPath(
  new URL("../migrations", import.meta.url),
);

export function aplicarMigraciones(db: Database.Database): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      nombre TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migraciones = readdirSync(directorioMigraciones)
    .filter((nombre) => /^\d+.*\.sql$/.test(nombre))
    .sort();
  const estaAplicada = db.prepare(
    "SELECT 1 FROM _migraciones WHERE nombre = ?",
  );
  const registrar = db.prepare(
    "INSERT INTO _migraciones (nombre) VALUES (?)",
  );
  const aplicadas: string[] = [];

  for (const nombre of migraciones) {
    if (estaAplicada.get(nombre)) {
      continue;
    }

    const sql = readFileSync(resolve(directorioMigraciones, nombre), "utf8");
    db.transaction(() => {
      db.exec(sql);
      registrar.run(nombre);
    })();
    aplicadas.push(nombre);
  }

  return aplicadas;
}

async function ejecutarDesdeTerminal(): Promise<void> {
  const rutaDb = resolve(process.argv[2] ?? "data/ventas.sqlite");
  await mkdir(dirname(rutaDb), { recursive: true });
  const db = abrirDb(rutaDb);

  try {
    const aplicadas = aplicarMigraciones(db);
    const detalle = aplicadas.length > 0 ? aplicadas.join(", ") : "ninguna pendiente";
    console.log(`Base de datos migrada: ${rutaDb} (${detalle})`);
  } finally {
    db.close();
  }
}

const esScriptPrincipal =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esScriptPrincipal) {
  await ejecutarDesdeTerminal();
}
