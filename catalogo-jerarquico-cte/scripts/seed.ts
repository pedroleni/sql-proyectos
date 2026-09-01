import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { abrirDb } from "../src/db.js";
import { crearCategoria } from "../src/categorias.js";
import { migrar } from "./migrar.js";

const rutaDb = resolve(process.argv[2] ?? "data/catalogo.sqlite");
mkdirSync(dirname(rutaDb), { recursive: true });

const db = abrirDb(rutaDb);

try {
  migrar(db);

  db.transaction(() => {
    db.exec("DELETE FROM productos; DELETE FROM categorias;");

    const electronica = crearCategoria(db, {
      nombre: "Electrónica",
      categoriaPadreId: null,
    });
    const informatica = crearCategoria(db, {
      nombre: "Informática",
      categoriaPadreId: electronica.id,
    });
    const portatiles = crearCategoria(db, {
      nombre: "Portátiles",
      categoriaPadreId: informatica.id,
    });
    const gaming = crearCategoria(db, {
      nombre: "Gaming",
      categoriaPadreId: portatiles.id,
    });
    const perifericos = crearCategoria(db, {
      nombre: "Periféricos",
      categoriaPadreId: informatica.id,
    });
    const audio = crearCategoria(db, {
      nombre: "Audio",
      categoriaPadreId: electronica.id,
    });
    const hogar = crearCategoria(db, {
      nombre: "Hogar",
      categoriaPadreId: null,
    });
    const cocina = crearCategoria(db, {
      nombre: "Cocina",
      categoriaPadreId: hogar.id,
    });
    const pequenosElectrodomesticos = crearCategoria(db, {
      nombre: "Pequeños electrodomésticos",
      categoriaPadreId: cocina.id,
    });

    const insertar = db.prepare(
      `INSERT INTO productos (categoria_id, nombre, precio)
       VALUES (?, ?, ?)`,
    );

    const productos: Array<[number, string, number]> = [
      [electronica.id, "Tarjeta regalo electrónica", 25],
      [informatica.id, "Hub USB-C 8 puertos", 54.9],
      [portatiles.id, "Portátil Ultraligero Air 14", 899],
      [portatiles.id, "Funda para portátil 15 pulgadas", 29.95],
      [gaming.id, "Portátil Gaming X15", 1499],
      [gaming.id, "Base refrigeradora RGB", 39.9],
      [perifericos.id, "Teclado mecánico compacto", 79.9],
      [perifericos.id, "Ratón inalámbrico Ergo", 49.5],
      [perifericos.id, "Monitor IPS 27 pulgadas", 269],
      [perifericos.id, "Webcam Full HD", 64.9],
      [audio.id, "Auriculares con cancelación de ruido", 199],
      [audio.id, "Altavoz Bluetooth Mini", 45],
      [hogar.id, "Termómetro digital interior", 18.5],
      [cocina.id, "Juego de cuchillos de cocina", 89],
      [cocina.id, "Báscula de cocina digital", 24.9],
      [pequenosElectrodomesticos.id, "Cafetera espresso compacta", 129],
      [pequenosElectrodomesticos.id, "Batidora de vaso", 74.5],
      [pequenosElectrodomesticos.id, "Tostadora de dos ranuras", 39],
      [pequenosElectrodomesticos.id, "Freidora de aire 5 litros", 109],
      [pequenosElectrodomesticos.id, "Hervidor eléctrico", 34.9],
    ];

    for (const producto of productos) insertar.run(...producto);
  })();

  console.log(`Datos de ejemplo insertados en ${rutaDb}`);
} finally {
  db.close();
}
