import type Database from 'better-sqlite3';

export interface Almacen {
  id: number;
  nombre: string;
}

export interface Producto {
  id: number;
  sku: string;
  nombre: string;
}

export interface Existencia {
  productoId: number;
  almacenId: number;
  cantidad: number;
}

export interface Movimiento {
  id: number;
  productoId: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  cantidad: number;
  ocurridoEn: string;
}

export class StockInsuficienteError extends Error {
  constructor(
    public readonly productoId: number,
    public readonly almacenId: number,
    public readonly disponible: number,
    public readonly solicitado: number,
  ) {
    super(
      `Stock insuficiente para el producto ${productoId} en el almacén ${almacenId}: ` +
        `disponible ${disponible}, solicitado ${solicitado}`,
    );
    this.name = 'StockInsuficienteError';
  }
}

interface FilaCantidad {
  cantidad: number;
}

interface FilaMovimiento {
  id: number;
  productoId: number;
  almacenOrigenId: number;
  almacenDestinoId: number;
  cantidad: number;
  ocurridoEn: string;
}

export function crearAlmacen(db: Database.Database, nombre: string): Almacen {
  const resultado = db.prepare('INSERT INTO almacenes (nombre) VALUES (?)').run(nombre);

  return {
    id: Number(resultado.lastInsertRowid),
    nombre,
  };
}

export function crearProducto(
  db: Database.Database,
  datos: { sku: string; nombre: string },
): Producto {
  const resultado = db
    .prepare('INSERT INTO productos (sku, nombre) VALUES (?, ?)')
    .run(datos.sku, datos.nombre);

  return {
    id: Number(resultado.lastInsertRowid),
    sku: datos.sku,
    nombre: datos.nombre,
  };
}

export function fijarExistencia(
  db: Database.Database,
  datos: { productoId: number; almacenId: number; cantidad: number },
): void {
  db.prepare(
    `INSERT INTO existencias (producto_id, almacen_id, cantidad)
     VALUES (@productoId, @almacenId, @cantidad)
     ON CONFLICT (producto_id, almacen_id)
     DO UPDATE SET cantidad = excluded.cantidad`,
  ).run(datos);
}

export function existenciaDe(
  db: Database.Database,
  productoId: number,
  almacenId: number,
): number {
  const fila = db
    .prepare(
      `SELECT cantidad
       FROM existencias
       WHERE producto_id = ? AND almacen_id = ?`,
    )
    .get(productoId, almacenId) as FilaCantidad | undefined;

  return fila?.cantidad ?? 0;
}

export function transferirStock(
  db: Database.Database,
  datos: {
    productoId: number;
    almacenOrigenId: number;
    almacenDestinoId: number;
    cantidad: number;
  },
): Movimiento {
  const ejecutarTransferencia = db.transaction((): Movimiento => {
    const disponible = existenciaDe(db, datos.productoId, datos.almacenOrigenId);

    if (disponible < datos.cantidad) {
      throw new StockInsuficienteError(
        datos.productoId,
        datos.almacenOrigenId,
        disponible,
        datos.cantidad,
      );
    }

    db.prepare(
      `UPDATE existencias
       SET cantidad = cantidad - @cantidad
       WHERE producto_id = @productoId AND almacen_id = @almacenOrigenId`,
    ).run(datos);

    db.prepare(
      `INSERT INTO existencias (producto_id, almacen_id, cantidad)
       VALUES (@productoId, @almacenDestinoId, @cantidad)
       ON CONFLICT (producto_id, almacen_id)
       DO UPDATE SET cantidad = cantidad + excluded.cantidad`,
    ).run(datos);

    const resultado = db.prepare(
      `INSERT INTO movimientos (
         producto_id,
         almacen_origen_id,
         almacen_destino_id,
         cantidad
       ) VALUES (
         @productoId,
         @almacenOrigenId,
         @almacenDestinoId,
         @cantidad
       )`,
    ).run(datos);

    const movimiento = db
      .prepare(
        `SELECT
           id,
           producto_id AS productoId,
           almacen_origen_id AS almacenOrigenId,
           almacen_destino_id AS almacenDestinoId,
           cantidad,
           ocurrido_en AS ocurridoEn
         FROM movimientos
         WHERE id = ?`,
      )
      .get(resultado.lastInsertRowid) as FilaMovimiento;

    return movimiento;
  });

  return ejecutarTransferencia();
}

export function historialDe(db: Database.Database, productoId: number): Movimiento[] {
  return db
    .prepare(
      `SELECT
         id,
         producto_id AS productoId,
         almacen_origen_id AS almacenOrigenId,
         almacen_destino_id AS almacenDestinoId,
         cantidad,
         ocurrido_en AS ocurridoEn
       FROM movimientos
       WHERE producto_id = ?
       ORDER BY ocurrido_en ASC, id ASC`,
    )
    .all(productoId) as FilaMovimiento[];
}

