<!-- src/App.vue -->
<template>
  <!-- Contenedor raíz con flexbox vertical y altura mínima 100vh -->
  <div class="d-flex flex-column min-vh-100">
    <!-- NAVBAR -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">CI Manager</a>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Inicio</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/cis">Configuration Items</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/usuarios">Usuarios</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/cartas">Cartas Responsivas</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- CONTENIDO PRINCIPAL que se expande -->
    <div class="container mt-4 flex-grow-1">
      <router-view />
    </div>

    <!-- FOOTER pegado abajo incluso sin contenido -->
    <footer class="bg-light text-center py-3 mt-auto border-top">
      <small>© 2025 CI Manager · Todos los derechos reservados.</small>
    </footer>
  </div>
</template>

<style scoped>
.nav-link.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
