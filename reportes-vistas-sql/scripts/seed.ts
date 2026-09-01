import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type Database from "better-sqlite3";
import { abrirDb } from "../src/db.js";
import { crearPedidoConLineas } from "../src/pedidos.js";

export function sembrarDatos(db: Database.Database): void {
  const sembrar = db.transaction(() => {
    db.exec(`
      DELETE FROM lineas_pedido;
      DELETE FROM pedidos;
      DELETE FROM productos;
      DELETE FROM clientes;
      DELETE FROM sqlite_sequence
      WHERE name IN ('lineas_pedido', 'pedidos', 'productos', 'clientes');
    `);

    const insertarCliente = db.prepare(
      "INSERT INTO clientes (nombre) VALUES (?)",
    );
    for (const nombre of ["Ana", "Bruno", "Carla"]) {
      insertarCliente.run(nombre);
    }

    const insertarProducto = db.prepare(
      "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
    );
    const productos = [
      ["Portátil", 1200],
      ["Monitor", 300],
      ["Teclado", 80],
      ["Ratón", 40],
      ["Auriculares", 150],
    ] as const;
    for (const producto of productos) insertarProducto.run(...producto);

    const pedidos = [
      { clienteId: 1, creadoEn: "2024-01-10", lineas: [{ productoId: 1, cantidad: 1, precioUnitario: 1200 }, { productoId: 4, cantidad: 2, precioUnitario: 40 }] },
      { clienteId: 2, creadoEn: "2024-01-22", lineas: [{ productoId: 2, cantidad: 2, precioUnitario: 300 }, { productoId: 3, cantidad: 1, precioUnitario: 80 }] },
      { clienteId: 3, creadoEn: "2024-02-03", lineas: [{ productoId: 1, cantidad: 2, precioUnitario: 1150 }] },
      { clienteId: 1, creadoEn: "2024-02-18", lineas: [{ productoId: 5, cantidad: 3, precioUnitario: 150 }, { productoId: 4, cantidad: 1, precioUnitario: 40 }] },
      { clienteId: 2, creadoEn: "2024-03-01", lineas: [{ productoId: 3, cantidad: 4, precioUnitario: 75 }, { productoId: 4, cantidad: 2, precioUnitario: 40 }] },
      { clienteId: 3, creadoEn: "2024-03-15", lineas: [{ productoId: 2, cantidad: 1, precioUnitario: 290 }, { productoId: 5, cantidad: 1, precioUnitario: 140 }] },
      { clienteId: 1, creadoEn: "2024-04-07", lineas: [{ productoId: 1, cantidad: 1, precioUnitario: 1100 }, { productoId: 2, cantidad: 2, precioUnitario: 280 }, { productoId: 4, cantidad: 1, precioUnitario: 35 }] },
      { clienteId: 2, creadoEn: "2024-05-20", lineas: [{ productoId: 5, cantidad: 2, precioUnitario: 145 }, { productoId: 3, cantidad: 2, precioUnitario: 80 }] },
    ];

    for (const pedido of pedidos) crearPedidoConLineas(db, pedido);
  });

  sembrar();
}

function ejecutarDesdeTerminal(): void {
  const ruta = process.argv[2] ?? "ventas.sqlite";
  const db = abrirDb(ruta);
  try {
    sembrarDatos(db);
    console.log(`Datos de ejemplo insertados en ${ruta}`);
  } finally {
    db.close();
  }
}

const entrada = process.argv[1];
if (entrada && import.meta.url === pathToFileURL(resolve(entrada)).href) {
  ejecutarDesdeTerminal();
}
