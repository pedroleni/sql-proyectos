> Este proyecto vive en la carpeta `reportes-vistas-sql/` de un repo con varios proyectos — clónalo entero y haz `cd reportes-vistas-sql` antes de los pasos siguientes.

# Reportes de ventas con vistas SQL

Proyecto de aprendizaje en TypeScript y SQLite. Las consultas de reportes usan vistas SQL reales para centralizar las agregaciones de ventas.

## Requisitos

- Node.js 20 o posterior
- npm

## Ejecución

```bash
npm install
npm run migrate
npm run seed
npm test
```

`npm run migrate` crea `ventas.sqlite` y aplica, en orden, los archivos de `migrations/`. `npm run seed` carga clientes, productos y ocho pedidos de ejemplo. Para usar otro archivo se puede ejecutar `npx tsx scripts/migrar.ts otra.sqlite` y `npx tsx scripts/seed.ts otra.sqlite`.

## Arquitectura

`resumen_pedidos` calcula el total de cada pedido sumando sus líneas. El total no se guarda en `pedidos`: así siempre refleja las líneas reales y nunca puede quedar desincronizado después de una inserción o modificación. TypeScript consulta esta vista como una tabla y no repite el `JOIN` ni la fórmula del total.

`top_productos` concentra de la misma forma las unidades vendidas y los ingresos por producto. Los reportes consumen ambas vistas y mantienen la definición de cada métrica en un único lugar.

Cada línea guarda `precio_unitario` porque ese es el precio efectivo de la venta. `productos.precio` puede cambiar más adelante; leer siempre el precio actual alteraría incorrectamente el valor histórico de pedidos ya realizados.
