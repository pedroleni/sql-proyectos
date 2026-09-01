import type Database from "better-sqlite3";

export interface LineaPedidoNueva {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
}

export interface PedidoNuevo {
  clienteId: number;
  creadoEn: string;
  lineas: LineaPedidoNueva[];
}

export interface ResumenPedido {
  pedido_id: number;
  cliente_id: number;
  cliente_nombre: string;
  creado_en: string;
  total: number;
}

export function crearPedidoConLineas(
  db: Database.Database,
  pedido: PedidoNuevo,
): { pedidoId: number } {
  const insertarPedido = db.prepare(
    "INSERT INTO pedidos (cliente_id, creado_en) VALUES (?, ?)",
  );
  const insertarLinea = db.prepare(`
    INSERT INTO lineas_pedido
      (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (?, ?, ?, ?)
  `);

  const guardar = db.transaction(() => {
    const resultado = insertarPedido.run(pedido.clienteId, pedido.creadoEn);
    const pedidoId = Number(resultado.lastInsertRowid);

    for (const linea of pedido.lineas) {
      insertarLinea.run(
        pedidoId,
        linea.productoId,
        linea.cantidad,
        linea.precioUnitario,
      );
    }

    return { pedidoId };
  });

  return guardar();
}

export function resumenDePedido(
  db: Database.Database,
  pedidoId: number,
): ResumenPedido | undefined {
  return db
    .prepare("SELECT * FROM resumen_pedidos WHERE pedido_id = ?")
    .get(pedidoId) as ResumenPedido | undefined;
}

export function resumenDeCliente(
  db: Database.Database,
  clienteId: number,
): ResumenPedido[] {
  return db
    .prepare(`
      SELECT *
      FROM resumen_pedidos
      WHERE cliente_id = ?
      ORDER BY creado_en ASC, pedido_id ASC
    `)
    .all(clienteId) as ResumenPedido[];
}
