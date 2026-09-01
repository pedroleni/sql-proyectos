import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buscarPorNombre,
  crearIndiceNombre,
  planDeBusqueda,
} from "../src/busqueda.js";
import { crearCategoria } from "../src/categorias.js";
import { abrirDb } from "../src/db.js";
import { migrar } from "../scripts/migrar.js";

describe("búsqueda de productos y plan de ejecución", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = abrirDb(":memory:");
    migrar(db);
    const categoria = crearCategoria(db, {
      nombre: "Portátiles",
      categoriaPadreId: null,
    });
    const insertar = db.prepare(
      `INSERT INTO productos (categoria_id, nombre, precio)
       VALUES (?, ?, ?)`,
    );
    insertar.run(categoria.id, "Portátil Gaming X15", 1499);
    insertar.run(categoria.id, "Ratón inalámbrico", 49.5);
  });

  afterEach(() => {
    db.close();
  });

  it("encuentra productos mediante una coincidencia parcial", () => {
    const resultados = buscarPorNombre(db, "port");

    expect(resultados.map(({ nombre }) => nombre)).toEqual([
      "Portátil Gaming X15",
    ]);
  });

  it("hace un recorrido completo si no existe el índice", () => {
    const plan = planDeBusqueda(db, "port").join(" ");

    expect(plan).toMatch(/SCAN\s+productos/i);
    expect(plan).not.toMatch(/productos_nombre_idx|USING(?:\s+COVERING)?\s+INDEX/i);
  });

  it("sigue recorriendo la tabla con índice por el comodín inicial", () => {
    crearIndiceNombre(db);
    const plan = planDeBusqueda(db, "port").join(" ");

    /*
     * Un índice B-tree ordena desde el principio del texto. LIKE '%port%'
     * no fija ese comienzo, así que SQLite no puede convertirlo en un rango
     * del índice y mantiene SCAN productos.
     */
    expect(plan).toMatch(/SCAN\s+productos/i);
    expect(plan).not.toMatch(/productos_nombre_idx|USING(?:\s+COVERING)?\s+INDEX/i);
  });
});
