// backend/models/Producto.js
const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
});

module.exports = mongoose.model('Producto', ProductoSchema);
