import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { crearPedidoConLineas } from "../src/pedidos.js";
import {
  ingresosTotalesEntreFechas,
  topProductos,
} from "../src/reportes.js";
import { dbDePrueba, insertarCliente, insertarProducto } from "./ayudas.js";

describe("reportes", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = dbDePrueba();
  });

  afterEach(() => db.close());

  it("devuelve primero el producto con más ingresos", () => {
    const clienteId = insertarCliente(db);
    const premiumId = insertarProducto(db, "Premium", 100);
    const popularId = insertarProducto(db, "Popular", 10);

    crearPedidoConLineas(db, {
      clienteId,
      creadoEn: "2024-02-01",
      lineas: [
        { productoId: premiumId, cantidad: 3, precioUnitario: 100 },
        { productoId: popularId, cantidad: 20, precioUnitario: 10 },
      ],
    });

    expect(topProductos(db, 1)).toEqual([
      {
        producto_id: premiumId,
        nombre: "Premium",
        unidades_vendidas: 3,
        ingresos_totales: 300,
      },
    ]);
  });

  it("suma solo los pedidos dentro del rango inclusivo", () => {
    const clienteId = insertarCliente(db);
    const productoId = insertarProducto(db, "Servicio", 10);

    for (const [creadoEn, cantidad] of [
      ["2023-12-31", 100],
      ["2024-01-01", 2],
      ["2024-01-31", 3],
      ["2024-02-01", 100],
    ] as const) {
      crearPedidoConLineas(db, {
        clienteId,
        creadoEn,
        lineas: [{ productoId, cantidad, precioUnitario: 10 }],
      });
    }

    expect(
      ingresosTotalesEntreFechas(db, "2024-01-01", "2024-01-31"),
    ).toBe(50);
  });
});
