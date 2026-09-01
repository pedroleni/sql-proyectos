import type Database from "better-sqlite3";
import type { Producto } from "./tipos.js";

interface FilaProducto {
  id: number;
  categoria_id: number;
  nombre: string;
  precio: number;
}

interface FilaPlan {
  id: number;
  parent: number;
  notused: number;
  detail: string;
}

export function buscarPorNombre(
  db: Database.Database,
  texto: string,
): Producto[] {
  const filas = db
    .prepare(
      `SELECT id, categoria_id, nombre, precio
       FROM productos
       WHERE nombre LIKE '%' || ? || '%'
       ORDER BY id`,
    )
    .all(texto) as FilaProducto[];

  return filas.map((fila) => ({
    id: fila.id,
    categoriaId: fila.categoria_id,
    nombre: fila.nombre,
    precio: fila.precio,
  }));
}

export function planDeBusqueda(
  db: Database.Database,
  texto: string,
): string[] {
  const filas = db
    .prepare(
      `EXPLAIN QUERY PLAN
       SELECT *
       FROM productos
       WHERE nombre LIKE '%' || ? || '%'`,
    )
    .all(texto) as FilaPlan[];

  return filas.map(
    ({ id, parent, detail }) => `id=${id} parent=${parent} detail=${detail}`,
  );
}

export function crearIndiceNombre(db: Database.Database): void {
  db.exec(
    "CREATE INDEX IF NOT EXISTS productos_nombre_idx ON productos(nombre)",
  );
}
