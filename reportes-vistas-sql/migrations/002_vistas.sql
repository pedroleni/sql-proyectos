CREATE VIEW resumen_pedidos AS
SELECT
  p.id AS pedido_id,
  p.cliente_id,
  c.nombre AS cliente_nombre,
  p.creado_en,
  SUM(lp.cantidad * lp.precio_unitario) AS total
FROM pedidos p
JOIN clientes c ON c.id = p.cliente_id
JOIN lineas_pedido lp ON lp.pedido_id = p.id
GROUP BY p.id;

CREATE VIEW top_productos AS
SELECT
  pr.id AS producto_id,
  pr.nombre,
  SUM(lp.cantidad) AS unidades_vendidas,
  SUM(lp.cantidad * lp.precio_unitario) AS ingresos_totales
FROM productos pr
JOIN lineas_pedido lp ON lp.producto_id = pr.id
GROUP BY pr.id
ORDER BY ingresos_totales DESC;
