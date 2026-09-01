> Este proyecto vive en la carpeta `catalogo-jerarquico-cte/` de un repo con varios proyectos — clónalo entero y haz `cd catalogo-jerarquico-cte` antes de los pasos siguientes.

# Catálogo jerárquico con CTE recursiva

Proyecto de aprendizaje en TypeScript y SQLite para recorrer un árbol de
categorías de profundidad arbitraria y observar planes reales de ejecución.

## Requisitos

- Node.js 20 o posterior.
- npm.

## Ejecución

```bash
npm install
npm run migrate
npm run seed
npm test
```

`npm run migrate` crea `data/catalogo.sqlite` y aplica, en orden, los archivos
de `migrations/` que aún no estén registrados. `npm run seed` carga un catálogo
de ejemplo reproducible con 20 productos. Si se desea usar otro fichero, los
scripts aceptan la ruta como argumento directo:

```bash
npx tsx scripts/migrar.ts otra-ruta/catalogo.sqlite
npx tsx scripts/seed.ts otra-ruta/catalogo.sqlite
```

## Arquitectura

`src/db.ts` abre SQLite y activa las claves foráneas en cada conexión.
`src/categorias.ts` contiene las escrituras y recorridos del árbol, mientras
que `src/busqueda.ts` contiene la búsqueda textual, la creación del índice y
la inspección mediante `EXPLAIN QUERY PLAN`. Los tests usan bases SQLite reales
en memoria; no hay ORM ni mocks.

La CTE recursiva tiene dos partes. El caso base selecciona la categoría desde
la que empieza el recorrido. El caso recursivo une `categorias` con la propia
CTE y selecciona las filas cuyo padre apareció en la iteración anterior.
SQLite repite esa parte hasta que no aparecen filas nuevas. El resultado
incluye la categoría inicial y todos sus descendientes, aunque el árbol tenga
más niveles en el futuro. Para obtener productos se usa la misma CTE dentro de
una sola consulta y se enlaza su resultado con `productos`; no se recorren los
nodos en TypeScript ni se hace una consulta por nivel.

La búsqueda utiliza `LIKE '%' || ? || '%'`. Un índice B-tree normal sobre
`productos(nombre)` está ordenado por el comienzo del valor, pero el comodín
inicial permite que la coincidencia empiece en cualquier posición. Por eso
SQLite muestra `SCAN productos` tanto antes como después de crear
`productos_nombre_idx`: ese índice no acelera esta consulta. Un patrón de
prefijo como `LIKE 'texto%'` sí puede delimitar un rango y aprovechar un índice
cuando la configuración de `LIKE` y la intercalación (`COLLATE`) del índice son
compatibles. Para búsquedas eficientes en cualquier parte del texto haría
falta otra estrategia, por ejemplo SQLite FTS.
