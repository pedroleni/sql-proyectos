> Este proyecto vive en la carpeta `inventario-transaccional/` de un repo con varios proyectos — clónalo entero y haz `cd inventario-transaccional` antes de los pasos siguientes.

# inventario-transaccional-sqlite

Proyecto de aprendizaje que implementa transferencias atómicas de stock entre almacenes con TypeScript, `better-sqlite3` y SQLite real.

## Requisitos

- Node.js 20 o posterior.
- npm.

No requiere Docker ni un servidor: SQLite guarda la base de datos en un fichero local.

## Ejecución

Desde la raíz del proyecto:

```bash
npm install
npm run migrate
npm test
```

`npm run migrate` crea `db.sqlite` en la raíz. Si ya existe, lo sobrescribe y aplica, en orden, todos los ficheros de `migrations/`. También se puede indicar otra ruta con `npm run migrate -- ruta/a/base.sqlite`.

`npm test` ejecuta Vitest. Cada test crea y migra su propia base de datos SQLite temporal, por lo que los tests no comparten estado ni dejan ficheros en el proyecto.

## Arquitectura

`src/db.ts` abre cada conexión y activa `PRAGMA foreign_keys = ON`, porque esa configuración pertenece a la conexión y no se conserva al cerrar y reabrir la base de datos.

`src/inventario.ts` contiene las operaciones del dominio. `transferirStock` usa `db.transaction()` para agrupar tres escrituras: descontar el origen, acreditar el destino y registrar el movimiento. Las tres se confirman juntas o, si cualquiera falla, SQLite revierte todas.

Sin una transacción, el orden de las operaciones puede corromper el inventario. Por ejemplo, si primero se acreditara el destino y después se comprobara o descontara el origen, un origen sin stock provocaría un error después del primer cambio. El destino conservaría unidades que nunca salieron del origen: stock duplicado. Un fallo tras descontar pero antes de acreditar produciría el problema inverso: stock desaparecido. `db.transaction()` evita ambos estados parciales.

La restricción `CHECK (cantidad >= 0)` de `existencias` es una segunda línea de defensa: SQLite rechaza cualquier escritura, incluso SQL directo, que intente guardar una cantidad negativa. No sustituye la comprobación explícita de stock ni la transacción, porque por sí sola no coordina el descuento, el abono y el historial como una única operación atómica.
