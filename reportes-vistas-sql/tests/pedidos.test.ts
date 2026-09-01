import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  crearPedidoConLineas,
  resumenDeCliente,
  resumenDePedido,
} from "../src/pedidos.js";
import { dbDePrueba, insertarCliente, insertarProducto } from "./ayudas.js";

describe("pedidos", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = dbDePrueba();
  });

  afterEach(() => db.close());

  it("calcula el total del pedido desde la vista", () => {
    const clienteId = insertarCliente(db);
    const productoA = insertarProducto(db, "Producto A", 10);
    const productoB = insertarProducto(db, "Producto B", 5);

    const { pedidoId } = crearPedidoConLineas(db, {
      clienteId,
      creadoEn: "2024-02-10",
      lineas: [
        { productoId: productoA, cantidad: 3, precioUnitario: 10 },
        { productoId: productoB, cantidad: 2, precioUnitario: 5 },
      ],
    });

    expect(resumenDePedido(db, pedidoId)).toMatchObject({
      pedido_id: pedidoId,
      total: 40,
    });
  });

  it("devuelve los pedidos de un cliente ordenados por fecha", () => {
    const clienteId = insertarCliente(db, "Ada");
    const productoId = insertarProducto(db, "Curso", 20);

    crearPedidoConLineas(db, {
      clienteId,
      creadoEn: "2024-06-20",
      lineas: [{ productoId, cantidad: 2, precioUnitario: 20 }],
    });
    crearPedidoConLineas(db, {
      clienteId,
      creadoEn: "2024-01-05",
      lineas: [{ productoId, cantidad: 3, precioUnitario: 15 }],
    });

    const resumenes = resumenDeCliente(db, clienteId);
    expect(resumenes.map((fila) => fila.creado_en)).toEqual([
      "2024-01-05",
      "2024-06-20",
    ]);
    expect(resumenes.map((fila) => fila.total)).toEqual([45, 40]);
  });

  it("revierte todo el pedido si falla una de sus líneas", () => {
    const clienteId = insertarCliente(db);
    const productoId = insertarProducto(db, "Producto válido", 10);

    expect(() =>
      crearPedidoConLineas(db, {
        clienteId,
        creadoEn: "2024-03-12",
        lineas: [
          { productoId, cantidad: 1, precioUnitario: 10 },
          { productoId: 999_999, cantidad: 1, precioUnitario: 10 },
        ],
      }),
    ).toThrow();

    const pedidos = db.prepare("SELECT COUNT(*) AS total FROM pedidos").get() as {
      total: number;
    };
    const lineas = db
      .prepare("SELECT COUNT(*) AS total FROM lineas_pedido")
      .get() as { total: number };
    expect(pedidos.total).toBe(0);
    expect(lineas.total).toBe(0);
  });
});
