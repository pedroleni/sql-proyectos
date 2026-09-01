export interface Categoria {
  id: number;
  nombre: string;
  categoriaPadreId: number | null;
}

export interface Producto {
  id: number;
  categoriaId: number;
  nombre: string;
  precio: number;
}
