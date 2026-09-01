import type Database from "better-sqlite3";

export interface ClientePorCategoria {
  categoria: string;
  clienteId: number;
  clienteNombre: string;
  total: number;
  puesto: number;
}

export interface PedidoConTotalAcumulado {
  pedidoId: number;
  clienteId: number;
  categoria: string;
  importe: number;
  creadoEn: string;
  totalAcumulado: number;
}

export interface VariacionMensual {
  mes: string;
  total: number;
  totalMesAnterior: number | null;
  variacionPorcentual: number | null;
}

interface MesConAnterior {
  mes: string;
  total: number;
  totalMesAnterior: number | null;
}

export function topClientesPorCategoria(
  db: Database.Database,
  n: number,
): ClientePorCategoria[] {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError("n debe ser un entero mayor o igual que 1");
  }

  const consulta = db.prepare(`
    WITH totales AS (
      SELECT
        p.categoria,
        p.cliente_id,
        c.nombre AS cliente_nombre,
        SUM(p.importe) AS total
      FROM pedidos AS p
      JOIN clientes AS c ON c.id = p.cliente_id
      GROUP BY p.categoria, p.cliente_id, c.nombre
    ),
    clasificacion AS (
      SELECT
        categoria,
        cliente_id,
        cliente_nombre,
        total,
        ROW_NUMBER() OVER (
          PARTITION BY categoria
          ORDER BY total DESC, cliente_id ASC
        ) AS puesto
      FROM totales
    )
    SELECT
      categoria,
      cliente_id AS clienteId,
      cliente_nombre AS clienteNombre,
      total,
      puesto
    FROM clasificacion
    WHERE puesto <= ?
    ORDER BY categoria ASC, puesto ASC
  `);

  return consulta.all(n) as ClientePorCategoria[];
}

export function totalAcumuladoPorCliente(
  db: Database.Database,
  clienteId: number,
): PedidoConTotalAcumulado[] {
  const consulta = db.prepare(`
    SELECT
      id AS pedidoId,
      cliente_id AS clienteId,
      categoria,
      importe,
      creado_en AS creadoEn,
      SUM(importe) OVER (
        ORDER BY creado_en, id
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS totalAcumulado
    FROM pedidos
    WHERE cliente_id = ?
    ORDER BY creado_en ASC, id ASC
  `);

  return consulta.all(clienteId) as PedidoConTotalAcumulado[];
}

export function variacionMensual(db: Database.Database): VariacionMensual[] {
  const consulta = db.prepare(`
    WITH totales_mensuales AS (
      SELECT
        substr(creado_en, 1, 7) AS mes,
        SUM(importe) AS total
      FROM pedidos
      GROUP BY substr(creado_en, 1, 7)
    )
    SELECT
      mes,
      total,
      LAG(total) OVER (ORDER BY mes) AS totalMesAnterior
    FROM totales_mensuales
    ORDER BY mes ASC
  `);

  const meses = consulta.all() as MesConAnterior[];

  // El porcentaje se calcula aquí para mantener legible la consulta que enseña LAG.
  return meses.map((fila) => ({
    ...fila,
    variacionPorcentual:
      fila.totalMesAnterior === null || fila.totalMesAnterior === 0
        ? null
        : ((fila.total - fila.totalMesAnterior) / fila.totalMesAnterior) * 100,
  }));
}
