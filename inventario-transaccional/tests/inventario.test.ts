import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { abrirDb } from '../src/db';
import {
  StockInsuficienteError,
  crearAlmacen,
  crearProducto,
  existenciaDe,
  fijarExistencia,
  historialDe,
  transferirStock,
} from '../src/inventario';

const raizProyecto = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directorioMigraciones = resolve(raizProyecto, 'migrations');

function migrar(db: Database.Database): void {
  const nombres = readdirSync(directorioMigraciones)
    .filter((nombre) => nombre.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const nombre of nombres) {
    db.exec(readFileSync(join(directorioMigraciones, nombre), 'utf8'));
  }
}

describe('inventario transaccional', () => {
  let db: Database.Database;
  let directorioTemporal: string;

  beforeEach(() => {
    directorioTemporal = mkdtempSync(join(tmpdir(), 'inventario-sqlite-'));
    db = abrirDb(join(directorioTemporal, 'test.sqlite'));
    migrar(db);
  });

  afterEach(() => {
    db.close();
    rmSync(directorioTemporal, { recursive: true, force: true });
  });

  it('transfiere stock y registra el movimiento de forma atómica', () => {
    const origen = crearAlmacen(db, 'Almacén A');
    const destino = crearAlmacen(db, 'Almacén B');
    const producto = crearProducto(db, { sku: 'SKU-001', nombre: 'Teclado' });
    fijarExistencia(db, { productoId: producto.id, almacenId: origen.id, cantidad: 10 });

    const movimiento = transferirStock(db, {
      productoId: producto.id,
      almacenOrigenId: origen.id,
      almacenDestinoId: destino.id,
      cantidad: 4,
    });

    expect(existenciaDe(db, producto.id, origen.id)).toBe(6);
    expect(existenciaDe(db, producto.id, destino.id)).toBe(4);
    expect(historialDe(db, producto.id)).toEqual([
      {
        id: movimiento.id,
        productoId: producto.id,
        almacenOrigenId: origen.id,
        almacenDestinoId: destino.id,
        cantidad: 4,
        ocurridoEn: movimiento.ocurridoEn,
      },
    ]);
  });

  it('no modifica ninguna existencia cuando el stock es insuficiente', () => {
    const origen = crearAlmacen(db, 'Almacén A');
    const destino = crearAlmacen(db, 'Almacén B');
    const producto = crearProducto(db, { sku: 'SKU-002', nombre: 'Ratón' });
    fijarExistencia(db, { productoId: producto.id, almacenId: origen.id, cantidad: 6 });
    fijarExistencia(db, { productoId: producto.id, almacenId: destino.id, cantidad: 4 });

    let errorCapturado: unknown;
    try {
      transferirStock(db, {
        productoId: producto.id,
        almacenOrigenId: origen.id,
        almacenDestinoId: destino.id,
        cantidad: 100,
      });
    } catch (error) {
      errorCapturado = error;
    }

    expect(errorCapturado).toBeInstanceOf(StockInsuficienteError);
    expect(errorCapturado).toMatchObject({
      productoId: producto.id,
      almacenId: origen.id,
      disponible: 6,
      solicitado: 100,
    });
    expect(existenciaDe(db, producto.id, origen.id)).toBe(6);
    expect(existenciaDe(db, producto.id, destino.id)).toBe(4);
    expect(historialDe(db, producto.id)).toEqual([]);
  });

  it('crea la existencia del destino cuando todavía no hay una fila', () => {
    const origen = crearAlmacen(db, 'Almacén A');
    const destino = crearAlmacen(db, 'Almacén nuevo');
    const producto = crearProducto(db, { sku: 'SKU-003', nombre: 'Monitor' });
    fijarExistencia(db, { productoId: producto.id, almacenId: origen.id, cantidad: 8 });

    transferirStock(db, {
      productoId: producto.id,
      almacenOrigenId: origen.id,
      almacenDestinoId: destino.id,
      cantidad: 3,
    });

    expect(existenciaDe(db, producto.id, destino.id)).toBe(3);
    expect(
      db
        .prepare(
          'SELECT cantidad FROM existencias WHERE producto_id = ? AND almacen_id = ?',
        )
        .get(producto.id, destino.id),
    ).toEqual({ cantidad: 3 });
  });

  it('deja que SQLite rechace directamente una existencia negativa mediante CHECK', () => {
    const almacen = crearAlmacen(db, 'Almacén A');
    const producto = crearProducto(db, { sku: 'SKU-004', nombre: 'Webcam' });
    fijarExistencia(db, { productoId: producto.id, almacenId: almacen.id, cantidad: 2 });

    expect(() => {
      db.prepare(
        `UPDATE existencias
         SET cantidad = -1
         WHERE producto_id = ? AND almacen_id = ?`,
      ).run(producto.id, almacen.id);
    }).toThrowError(/CHECK constraint failed/i);

    expect(existenciaDe(db, producto.id, almacen.id)).toBe(2);
  });

  it('mantiene un resultado consistente tras dos transferencias consecutivas', () => {
    const origen = crearAlmacen(db, 'Almacén A');
    const destino = crearAlmacen(db, 'Almacén B');
    const producto = crearProducto(db, { sku: 'SKU-005', nombre: 'Auriculares' });
    fijarExistencia(db, { productoId: producto.id, almacenId: origen.id, cantidad: 10 });

    for (const cantidad of [5, 5]) {
      transferirStock(db, {
        productoId: producto.id,
        almacenOrigenId: origen.id,
        almacenDestinoId: destino.id,
        cantidad,
      });
    }

    expect(existenciaDe(db, producto.id, origen.id)).toBe(0);
    expect(existenciaDe(db, producto.id, destino.id)).toBe(10);
    expect(historialDe(db, producto.id)).toHaveLength(2);
  });
});

