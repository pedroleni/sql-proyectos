import type Database from "better-sqlite3";
import type { Categoria, Producto } from "./tipos.js";

interface FilaCategoria {
  id: number;
  nombre: string;
  categoria_padre_id: number | null;
}

interface FilaProducto {
  id: number;
  categoria_id: number;
  nombre: string;
  precio: number;
}

export interface NuevaCategoria {
  nombre: string;
  categoriaPadreId: number | null;
}

function aCategoria(fila: FilaCategoria): Categoria {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoriaPadreId: fila.categoria_padre_id,
  };
}

function aProducto(fila: FilaProducto): Producto {
  return {
    id: fila.id,
    categoriaId: fila.categoria_id,
    nombre: fila.nombre,
    precio: fila.precio,
  };
}

export function crearCategoria(
  db: Database.Database,
  { nombre, categoriaPadreId }: NuevaCategoria,
): Categoria {
  const resultado = db
    .prepare(
      `INSERT INTO categorias (nombre, categoria_padre_id)
       VALUES (?, ?)`,
    )
    .run(nombre, categoriaPadreId);

  const fila = db
    .prepare(
      `SELECT id, nombre, categoria_padre_id
       FROM categorias
       WHERE id = ?`,
    )
    .get(Number(resultado.lastInsertRowid)) as FilaCategoria;

  return aCategoria(fila);
}

export function descendientesDeCategoria(
  db: Database.Database,
  categoriaId: number,
): Categoria[] {
  const filas = db
    .prepare(
      `WITH RECURSIVE arbol(id, nombre, categoria_padre_id) AS (
         SELECT id, nombre, categoria_padre_id
         FROM categorias
         WHERE id = ?

         UNION ALL

         SELECT c.id, c.nombre, c.categoria_padre_id
         FROM categorias AS c
         JOIN arbol AS a ON c.categoria_padre_id = a.id
       )
       SELECT id, nombre, categoria_padre_id
       FROM arbol`,
    )
    .all(categoriaId) as FilaCategoria[];

  return filas.map(aCategoria);
}

export function productosDeCategoriaYSubcategorias(
  db: Database.Database,
  categoriaId: number,
): Producto[] {
  /*
   * La CTE se mantiene en esta única consulta y se une a productos. Esto evita
   * traer ids a TypeScript y lanzar una segunda consulta con un IN dinámico.
   */
  const filas = db
    .prepare(
      `WITH RECURSIVE arbol(id, nombre, categoria_padre_id) AS (
         SELECT id, nombre, categoria_padre_id
         FROM categorias
         WHERE id = ?

         UNION ALL

         SELECT c.id, c.nombre, c.categoria_padre_id
         FROM categorias AS c
         JOIN arbol AS a ON c.categoria_padre_id = a.id
       )
       SELECT p.id, p.categoria_id, p.nombre, p.precio
       FROM productos AS p
       JOIN arbol AS a ON p.categoria_id = a.id
       ORDER BY p.id`,
    )
    .all(categoriaId) as FilaProducto[];

  return filas.map(aProducto);
}

export type { Categoria, Producto } from "./tipos.js";
