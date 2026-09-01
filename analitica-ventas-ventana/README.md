> Este proyecto vive en la carpeta `analitica-ventas-ventana/` de un repo con varios proyectos — clónalo entero y haz `cd analitica-ventas-ventana` antes de los pasos siguientes.

# Analítica de ventas con funciones de ventana

Proyecto didáctico en TypeScript que consulta una base SQLite real con
`ROW_NUMBER`, `SUM() OVER` y `LAG`. Muestra rankings dentro de cada categoría,
acumulados pedido a pedido y comparaciones de ventas entre meses.

## Requisitos

- Node.js 20 o posterior.
- npm.

## Ejecución

Desde la raíz del proyecto:

```bash
npm install
npm run migrate
npm run seed
npm test
```

Los dos primeros scripts crean y cargan `data/ventas.sqlite`. Para ver los tres
informes con los datos de ejemplo:

```bash
npm run dev
```

Tanto `migrate` como `seed` aceptan otra ruta si se invoca directamente el
script, por ejemplo `npx tsx scripts/migrar.ts otra-ruta.sqlite`. Las migraciones
aplicadas se registran en `_migraciones`, por lo que ejecutar `migrate` de nuevo
no repite cambios ya aplicados. `seed` reemplaza únicamente los clientes y
pedidos de ejemplo para que su resultado sea reproducible.

## Arquitectura

- `migrations/`: esquema SQL numerado. `scripts/migrar.ts` lee los ficheros en
  orden y aplica cada uno dentro de una transacción.
- `scripts/seed.ts`: carga cuatro clientes y 28 pedidos en tres categorías y
  cuatro meses.
- `src/db.ts`: abre `better-sqlite3` y activa las claves foráneas.
- `src/analitica.ts`: contiene las tres consultas y sus tipos de resultado.
- `tests/`: usa una base SQLite `:memory:` nueva en cada prueba, sin mocks, y
  aplica la migración real antes de sembrar datos controlados.

`ROW_NUMBER()` se evalúa después de `WHERE` dentro del orden lógico de una
consulta SQL. Por eso el alias `puesto` todavía no existe cuando se procesa el
`WHERE` del mismo `SELECT`, y tampoco se puede colocar allí directamente una
función de ventana. La consulta calcula primero el ranking en la CTE
`clasificacion`; el `SELECT` exterior recibe `puesto` como una columna normal y
ya puede aplicar `WHERE puesto <= ?`.

Para el acumulado, `SUM(importe) OVER (...)` conserva una fila por pedido y hace
que SQLite calcule el marco desde el primer pedido hasta la fila actual. Un
`GROUP BY` reduciría esas filas a un único total. Recorrerlas y sumar en
TypeScript produciría el mismo número final, pero trasladaría lógica de datos a
la aplicación, exigiría cargar y ordenar todas las filas correctamente y sería
más fácil de desincronizar respecto de la consulta. La ventana expresa el
cálculo junto a los datos y garantiza un orden estable con `creado_en, id`.

En la variación mensual, SQL calcula los totales y `LAG(total)`; el porcentaje
se calcula después en TypeScript para que la consulta didáctica mantenga visible
el papel de `LAG`. El primer mes devuelve `null` tanto en `totalMesAnterior` como
en `variacionPorcentual`, porque no existe un mes anterior con el que comparar.
