<!-- src/views/Productos.vue -->
<template>
  <div>
    <h2>Lista de productos</h2>
    <ul>
      <li v-for="p in productos" :key="p._id">
        {{ p.nombre }} - ${{ p.precio }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { obtenerProductos } from '../services/ejemploService.js';

const productos = ref([]);

onMounted(async () => {
  const res = await obtenerProductos();
  productos.value = res.data;
});
</script>
