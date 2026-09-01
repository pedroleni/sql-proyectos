import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  crearCategoria,
  descendientesDeCategoria,
  productosDeCategoriaYSubcategorias,
} from "../src/categorias.js";
import { abrirDb } from "../src/db.js";
import { migrar } from "../scripts/migrar.js";

describe("catálogo jerárquico", () => {
  let db: Database.Database;
  let raizId: number;
  let hijoId: number;
  let nietoId: number;

  beforeEach(() => {
    db = abrirDb(":memory:");
    migrar(db);

    const raiz = crearCategoria(db, {
      nombre: "Raíz",
      categoriaPadreId: null,
    });
    const hijo = crearCategoria(db, {
      nombre: "Hijo",
      categoriaPadreId: raiz.id,
    });
    const nieto = crearCategoria(db, {
      nombre: "Nieto",
      categoriaPadreId: hijo.id,
    });

    raizId = raiz.id;
    hijoId = hijo.id;
    nietoId = nieto.id;
  });

  afterEach(() => {
    db.close();
  });

  it("recorre todos los niveles desde la raíz", () => {
    const categorias = descendientesDeCategoria(db, raizId);

    expect(categorias.map(({ nombre }) => nombre)).toEqual([
      "Raíz",
      "Hijo",
      "Nieto",
    ]);
  });

  it("no incluye los antepasados al recorrer desde un hijo", () => {
    const categorias = descendientesDeCategoria(db, hijoId);

    expect(categorias.map(({ nombre }) => nombre)).toEqual(["Hijo", "Nieto"]);
    expect(categorias.map(({ nombre }) => nombre)).not.toContain("Raíz");
  });

  it("devuelve únicamente la propia categoría si es una hoja", () => {
    const categorias = descendientesDeCategoria(db, nietoId);

    expect(categorias).toHaveLength(1);
    expect(categorias[0]).toMatchObject({ id: nietoId, nombre: "Nieto" });
  });

  it("recupera productos de la categoría y de todo su subárbol", () => {
    const insertar = db.prepare(
      `INSERT INTO productos (categoria_id, nombre, precio)
       VALUES (?, ?, ?)`,
    );
    insertar.run(raizId, "Producto raíz", 10);
    insertar.run(hijoId, "Producto hijo", 20);
    insertar.run(nietoId, "Producto nieto", 30);

    const desdeRaiz = productosDeCategoriaYSubcategorias(db, raizId);
    const desdeHijo = productosDeCategoriaYSubcategorias(db, hijoId);

    expect(desdeRaiz.map(({ nombre }) => nombre)).toEqual([
      "Producto raíz",
      "Producto hijo",
      "Producto nieto",
    ]);
    expect(desdeHijo.map(({ nombre }) => nombre)).toEqual([
      "Producto hijo",
      "Producto nieto",
    ]);
    expect(desdeHijo.map(({ nombre }) => nombre)).not.toContain("Producto raíz");
  });
});
