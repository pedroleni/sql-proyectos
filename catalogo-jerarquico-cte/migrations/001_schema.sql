PRAGMA foreign_keys = ON;

CREATE TABLE categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria_padre_id INTEGER REFERENCES categorias(id)
);

CREATE TABLE productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_id INTEGER NOT NULL REFERENCES categorias(id),
  nombre TEXT NOT NULL,
  precio REAL NOT NULL CHECK (precio > 0)
);
