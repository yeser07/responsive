<!-- src/App.vue -->
<template>
  <div class="d-flex min-vh-100 flex-column">
    <div class="d-flex flex-grow-1">
      <!-- SIDEBAR IZQUIERDO -->
      <div class="d-flex flex-column flex-shrink-0 p-3 bg-dark" style="width: 4.5rem;" >
        <a href="/" class="d-block mb-3 text-center text-decoration-none">
          <i class="bi bi-bootstrap fs-2 text-primary"></i>
          <span class="visually-hidden">Inicio</span>
        </a>
        <ul class="nav nav-pills nav-flush flex-column mb-auto text-center">
          <li class="nav-item">
            <a href="#" class="nav-link active py-3 border-bottom" title="Inicio" data-bs-toggle="tooltip" data-bs-placement="right">
              <i class="bi bi-house-door fs-5"></i>
            </a>
          </li>
          <li>
            <a href="#" class="nav-link py-3 border-bottom" title="Dashboard" data-bs-toggle="tooltip" data-bs-placement="right">
              <i class="bi bi-speedometer2 fs-5"></i>
            </a>
          </li>
          <li>
            <a href="#" class="nav-link py-3 border-bottom" title="Órdenes" data-bs-toggle="tooltip" data-bs-placement="right">
              <i class="bi bi-table fs-5"></i>
            </a>
          </li>
          <li>
            <a href="#" class="nav-link py-3 border-bottom" title="Productos" data-bs-toggle="tooltip" data-bs-placement="right">
              <i class="bi bi-grid fs-5"></i>
            </a>
          </li>
          <li>
            <a href="#" class="nav-link py-3 border-bottom" title="Clientes" data-bs-toggle="tooltip" data-bs-placement="right">
              <i class="bi bi-people fs-5"></i>
            </a>
          </li>
        </ul>
        <div class="dropdown border-top pt-3 text-center">
          <a href="#" class="d-flex justify-content-center align-items-center link-dark dropdown-toggle" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://github.com/mdo.png" alt="user" width="32" height="32" class="rounded-circle">
          </a>
          <ul class="dropdown-menu text-small shadow" aria-labelledby="dropdownUser">
            <li><a class="dropdown-item" href="#">Nuevo proyecto...</a></li>
            <li><a class="dropdown-item" href="#">Configuración</a></li>
            <li><a class="dropdown-item" href="#">Perfil</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">Cerrar sesión</a></li>
          </ul>
        </div>
      </div>

      <!-- CONTENIDO PRINCIPAL -->
      <div class="flex-grow-1 p-4 bg-secondary text-white align-items-center">
        <router-view />
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="bg-dark text-center py-3 border-top">
      <small style="color: aliceblue;">© 2025 CI Manager · Todos los derechos reservados.</small>
    </footer>
  </div>
</template>

<script>
export default {
  mounted() {
    // Inicializar tooltips de Bootstrap 5
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach(tooltipEl => new bootstrap.Tooltip(tooltipEl));
  }
};
</script>

<style scoped>
.nav-link.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}
</style>
