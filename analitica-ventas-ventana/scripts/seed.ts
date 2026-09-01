import { resolve } from "node:path";
import { abrirDb } from "../src/db.js";

interface PedidoSemilla {
  clienteId: number;
  categoria: string;
  importe: number;
  creadoEn: string;
}

const clientes = [
  { id: 1, nombre: "Lucía Martín" },
  { id: 2, nombre: "Diego Sánchez" },
  { id: 3, nombre: "Marta López" },
  { id: 4, nombre: "Javier Ruiz" },
];

const pedidos: PedidoSemilla[] = [
  { clienteId: 1, categoria: "Tecnología", importe: 899, creadoEn: "2025-01-05" },
  { clienteId: 2, categoria: "Hogar", importe: 120, creadoEn: "2025-01-08" },
  { clienteId: 3, categoria: "Libros", importe: 42, creadoEn: "2025-01-12" },
  { clienteId: 4, categoria: "Tecnología", importe: 210, creadoEn: "2025-01-17" },
  { clienteId: 1, categoria: "Tecnología", importe: 349, creadoEn: "2025-01-21" },
  { clienteId: 2, categoria: "Libros", importe: 65, creadoEn: "2025-01-25" },
  { clienteId: 3, categoria: "Hogar", importe: 180, creadoEn: "2025-01-29" },
  { clienteId: 4, categoria: "Libros", importe: 28, creadoEn: "2025-02-02" },
  { clienteId: 1, categoria: "Hogar", importe: 75, creadoEn: "2025-02-06" },
  { clienteId: 2, categoria: "Tecnología", importe: 540, creadoEn: "2025-02-09" },
  { clienteId: 3, categoria: "Libros", importe: 95, creadoEn: "2025-02-13" },
  { clienteId: 4, categoria: "Hogar", importe: 260, creadoEn: "2025-02-16" },
  { clienteId: 1, categoria: "Tecnología", importe: 1299, creadoEn: "2025-02-20" },
  { clienteId: 2, categoria: "Hogar", importe: 88, creadoEn: "2025-02-23" },
  { clienteId: 3, categoria: "Libros", importe: 55, creadoEn: "2025-02-27" },
  { clienteId: 4, categoria: "Tecnología", importe: 330, creadoEn: "2025-03-03" },
  { clienteId: 1, categoria: "Libros", importe: 72, creadoEn: "2025-03-07" },
  { clienteId: 2, categoria: "Tecnología", importe: 680, creadoEn: "2025-03-11" },
  { clienteId: 3, categoria: "Hogar", importe: 145, creadoEn: "2025-03-15" },
  { clienteId: 4, categoria: "Libros", importe: 110, creadoEn: "2025-03-19" },
  { clienteId: 1, categoria: "Tecnología", importe: 459, creadoEn: "2025-03-22" },
  { clienteId: 2, categoria: "Libros", importe: 38, creadoEn: "2025-03-26" },
  { clienteId: 3, categoria: "Hogar", importe: 215, creadoEn: "2025-04-01" },
  { clienteId: 4, categoria: "Tecnología", importe: 275, creadoEn: "2025-04-05" },
  { clienteId: 1, categoria: "Hogar", importe: 190, creadoEn: "2025-04-10" },
  { clienteId: 2, categoria: "Tecnología", importe: 760, creadoEn: "2025-04-14" },
  { clienteId: 3, categoria: "Libros", importe: 125, creadoEn: "2025-04-20" },
  { clienteId: 4, categoria: "Hogar", importe: 310, creadoEn: "2025-04-26" },
];

const rutaDb = resolve(process.argv[2] ?? "data/ventas.sqlite");
const db = abrirDb(rutaDb);

try {
  const insertarCliente = db.prepare(
    "INSERT INTO clientes (id, nombre) VALUES (@id, @nombre)",
  );
  const insertarPedido = db.prepare(`
    INSERT INTO pedidos (cliente_id, categoria, importe, creado_en)
    VALUES (@clienteId, @categoria, @importe, @creadoEn)
  `);

  db.transaction(() => {
    db.exec("DELETE FROM pedidos; DELETE FROM clientes;");
    for (const cliente of clientes) insertarCliente.run(cliente);
    for (const pedido of pedidos) insertarPedido.run(pedido);
  })();

  console.log(`Datos sembrados en ${rutaDb}: ${clientes.length} clientes y ${pedidos.length} pedidos`);
} finally {
  db.close();
}
