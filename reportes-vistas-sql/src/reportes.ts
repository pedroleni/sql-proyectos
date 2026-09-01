import type Database from "better-sqlite3";

export interface TopProducto {
  producto_id: number;
  nombre: string;
  unidades_vendidas: number;
  ingresos_totales: number;
}

interface FilaIngresos {
  ingresos_totales: number;
}

export function topProductos(
  db: Database.Database,
  limite = 10,
): TopProducto[] {
  return db
    .prepare("SELECT * FROM top_productos LIMIT ?")
    .all(limite) as TopProducto[];
}

export function ingresosTotalesEntreFechas(
  db: Database.Database,
  desde: string,
  hasta: string,
): number {
  const fila = db
    .prepare(`
      SELECT COALESCE(SUM(total), 0) AS ingresos_totales
      FROM resumen_pedidos
      WHERE creado_en BETWEEN ? AND ?
    `)
    .get(desde, hasta) as FilaIngresos;

  return fila.ingresos_totales;
}
