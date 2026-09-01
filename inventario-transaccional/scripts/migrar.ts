import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { abrirDb } from '../src/db';

const raizProyecto = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directorioMigraciones = resolve(raizProyecto, 'migrations');
const rutaDb = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : resolve(raizProyecto, 'db.sqlite');

const migraciones = readdirSync(directorioMigraciones)
  .filter((nombre) => nombre.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b));

if (migraciones.length === 0) {
  throw new Error(`No se encontraron migraciones SQL en ${directorioMigraciones}`);
}

for (const sufijo of ['', '-journal', '-shm', '-wal']) {
  const ruta = `${rutaDb}${sufijo}`;
  if (existsSync(ruta)) {
    rmSync(ruta);
  }
}

const db = abrirDb(rutaDb);

try {
  console.log(`Creando base de datos: ${rutaDb}`);

  for (const nombre of migraciones) {
    const rutaMigracion = resolve(directorioMigraciones, nombre);
    const contenido = readFileSync(rutaMigracion, 'utf8');
    db.exec(contenido);
    console.log(`Aplicada: ${nombre}`);
  }

  console.log('Migraciones completadas.');
} finally {
  db.close();
}

