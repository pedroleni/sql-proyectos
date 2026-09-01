import type Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  topClientesPorCategoria,
  totalAcumuladoPorCliente,
  variacionMensual,
} from "../src/analitica.js";
import { abrirDb } from "../src/db.js";
import { aplicarMigraciones } from "../scripts/migrar.js";

describe("analítica de ventas con funciones de ventana", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = abrirDb(":memory:");
    aplicarMigraciones(db);
  });

  afterEach(() => {
    db.close();
  });

  function sembrarRanking(): void {
    const insertarCliente = db.prepare(
      "INSERT INTO clientes (id, nombre) VALUES (?, ?)",
    );
    insertarCliente.run(1, "Ana");
    insertarCliente.run(2, "Bruno");
    insertarCliente.run(3, "Carla");

    const insertarPedido = db.prepare(`
      INSERT INTO pedidos (cliente_id, categoria, importe, creado_en)
      VALUES (?, ?, ?, ?)
    `);
    insertarPedido.run(1, "libros", 30, "2025-01-01");
    insertarPedido.run(2, "libros", 100, "2025-01-02");
    insertarPedido.run(3, "libros", 120, "2025-01-03");
    insertarPedido.run(3, "libros", 80, "2025-01-04");
    insertarPedido.run(1, "tecnologia", 50, "2025-01-05");
    insertarPedido.run(1, "tecnologia", 70, "2025-01-06");
    insertarPedido.run(2, "tecnologia", 80, "2025-01-07");
    insertarPedido.run(3, "tecnologia", 20, "2025-01-08");
  }

  it("devuelve primero y segundo de cada categoría en su orden", () => {
    sembrarRanking();

    expect(topClientesPorCategoria(db, 2)).toEqual([
      {
        categoria: "libros",
        clienteId: 3,
        clienteNombre: "Carla",
        total: 200,
        puesto: 1,
      },
      {
        categoria: "libros",
        clienteId: 2,
        clienteNombre: "Bruno",
        total: 100,
        puesto: 2,
      },
      {
        categoria: "tecnologia",
        clienteId: 1,
        clienteNombre: "Ana",
        total: 120,
        puesto: 1,
      },
      {
        categoria: "tecnologia",
        clienteId: 2,
        clienteNombre: "Bruno",
        total: 80,
        puesto: 2,
      },
    ]);
  });

  it("limita el resultado al primer cliente de cada categoría", () => {
    sembrarRanking();

    expect(topClientesPorCategoria(db, 1)).toEqual([
      {
        categoria: "libros",
        clienteId: 3,
        clienteNombre: "Carla",
        total: 200,
        puesto: 1,
      },
      {
        categoria: "tecnologia",
        clienteId: 1,
        clienteNombre: "Ana",
        total: 120,
        puesto: 1,
      },
    ]);
  });

  it("calcula el total acumulado pedido a pedido", () => {
    db.prepare("INSERT INTO clientes (id, nombre) VALUES (?, ?)").run(1, "Ana");
    const insertarPedido = db.prepare(`
      INSERT INTO pedidos (cliente_id, categoria, importe, creado_en)
      VALUES (1, 'libros', ?, ?)
    `);
    insertarPedido.run(10, "2025-01-05");
    insertarPedido.run(20, "2025-01-10");
    insertarPedido.run(30, "2025-01-20");

    const resultado = totalAcumuladoPorCliente(db, 1);

    expect(resultado.map(({ importe, totalAcumulado }) => ({ importe, totalAcumulado })))
      .toEqual([
        { importe: 10, totalAcumulado: 10 },
        { importe: 20, totalAcumulado: 30 },
        { importe: 30, totalAcumulado: 60 },
      ]);
  });

  it("compara cada total mensual con el mes anterior", () => {
    db.prepare("INSERT INTO clientes (id, nombre) VALUES (?, ?)").run(1, "Ana");
    const insertarPedido = db.prepare(`
      INSERT INTO pedidos (cliente_id, categoria, importe, creado_en)
      VALUES (1, 'libros', ?, ?)
    `);
    insertarPedido.run(40, "2025-01-05");
    insertarPedido.run(60, "2025-01-18");
    insertarPedido.run(150, "2025-02-10");
    insertarPedido.run(50, "2025-03-02");
    insertarPedido.run(70, "2025-03-22");

    const resultado = variacionMensual(db);

    expect(resultado).toHaveLength(3);
    expect(resultado[0]).toEqual({
      mes: "2025-01",
      total: 100,
      totalMesAnterior: null,
      variacionPorcentual: null,
    });
    expect(resultado[1]).toMatchObject({
      mes: "2025-02",
      total: 150,
      totalMesAnterior: 100,
    });
    expect(resultado[1].variacionPorcentual).toBeCloseTo(50);
    expect(resultado[2]).toMatchObject({
      mes: "2025-03",
      total: 120,
      totalMesAnterior: 150,
    });
    expect(resultado[2].variacionPorcentual).toBeCloseTo(-20);
  });
});
