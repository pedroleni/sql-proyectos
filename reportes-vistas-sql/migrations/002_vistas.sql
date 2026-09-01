-- TODO(estudiante): esta vista está incompleta a propósito.
--
-- Objetivo: total debe ser la suma real de cantidad * precio_unitario
-- de TODAS las líneas de cada pedido — ahora mismo siempre vale 0.
--
-- Pista: SUM(lp.cantidad * lp.precio_unitario), agrupado por pedido
-- (GROUP BY p.id) — la multiplicación va DENTRO del SUM, no fuera.
--
-- npm test debe fallar tal cual está esto (todos los totales dan 0) y
-- pasar en cuanto el cálculo sea el real.
CREATE VIEW resumen_pedidos AS
SELECT
  p.id AS pedido_id,
  p.cliente_id,
  c.nombre AS cliente_nombre,
  p.creado_en,
  0 AS total -- TODO: sustituye por SUM(lp.cantidad * lp.precio_unitario)
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
