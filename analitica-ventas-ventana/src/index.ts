import { resolve } from "node:path";
import { abrirDb } from "./db.js";
import {
  topClientesPorCategoria,
  totalAcumuladoPorCliente,
  variacionMensual,
} from "./analitica.js";

const rutaDb = resolve(process.argv[2] ?? "data/ventas.sqlite");
const db = abrirDb(rutaDb);

try {
  console.log("\nDos mejores clientes por categoría");
  console.table(topClientesPorCategoria(db, 2));

  console.log("\nEvolución de compras de Lucía Martín");
  console.table(totalAcumuladoPorCliente(db, 1));

  console.log("\nVariación mensual de ventas");
  console.table(variacionMensual(db));
} finally {
  db.close();
}
