PRAGMA foreign_keys = ON;

CREATE TABLE almacenes (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE productos (
  id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL
);

CREATE TABLE existencias (
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  almacen_id INTEGER NOT NULL REFERENCES almacenes(id),
  cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
  PRIMARY KEY (producto_id, almacen_id)
);

CREATE TABLE movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  producto_id INTEGER NOT NULL REFERENCES productos(id),
  almacen_origen_id INTEGER NOT NULL REFERENCES almacenes(id),
  almacen_destino_id INTEGER NOT NULL REFERENCES almacenes(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  ocurrido_en TEXT NOT NULL DEFAULT (datetime('now'))
);

