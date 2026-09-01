import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";
import { abrirDb } from "../src/db.js";

const directorioProyecto = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function migrar(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
      nombre TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migraciones = readdirSync(resolve(directorioProyecto, "migrations"))
    .filter((nombre) => /^\d+.*\.sql$/.test(nombre))
    .sort();

  const estaAplicada = db.prepare(
    "SELECT 1 FROM migraciones_aplicadas WHERE nombre = ?",
  );
  const registrar = db.prepare(
    "INSERT INTO migraciones_aplicadas (nombre) VALUES (?)",
  );

  for (const nombre of migraciones) {
    if (estaAplicada.get(nombre)) continue;

    const sql = readFileSync(
      resolve(directorioProyecto, "migrations", nombre),
      "utf8",
    );
    db.transaction(() => {
      db.exec(sql);
      registrar.run(nombre);
    })();
  }
}

function ejecutarDesdeCli(): void {
  const rutaArgumento = process.argv[2];
  if (!rutaArgumento) {
    throw new Error("Uso: tsx scripts/migrar.ts <ruta-al-fichero.sqlite>");
  }

  const rutaDb = resolve(rutaArgumento);
  mkdirSync(dirname(rutaDb), { recursive: true });
  const db = abrirDb(rutaDb);
  try {
    migrar(db);
    console.log(`Migraciones aplicadas en ${rutaDb}`);
  } finally {
    db.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  ejecutarDesdeCli();
}
