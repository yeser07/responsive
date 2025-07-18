import axios from 'axios';

const API_URL = '/api/productos';

export const obtenerProductos = () => axios.get(API_URL);
export const crearProducto = (producto) => axios.post(API_URL, producto);
