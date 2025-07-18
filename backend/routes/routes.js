// backend/routes/producto.routes.js
const express = require('express');
const router = express.Router();
const Producto = require('../models/ejemplo');

// GET todos
router.get('/', async (req, res) => {
  const productos = await Producto.find();
  res.json(productos);
});

// POST nuevo
router.post('/', async (req, res) => {
  const nuevo = new Producto(req.body);
  const guardado = await nuevo.save();
  res.json(guardado);
});

module.exports = router;
