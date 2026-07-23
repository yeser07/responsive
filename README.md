CI Manager – Cartas Responsivas
================================

Aplicación web para gestionar User Owners, Configuration Items (activos),
asignaciones y cartas responsivas en PDF.

Arquitectura
------------
- `backend/` — Node.js, Express 5, MongoDB (Mongoose), JWT cookies, Puppeteer, Handlebars
- `frontend/` — Vue 3, Vite, Vue Router, Axios, Bootstrap 5, SweetAlert2, vue3-easy-data-table

Requisitos
----------
- Node.js 18+
- MongoDB en ejecución (por defecto `mongodb://localhost:27017`)
- (Opcional) Docker / Docker Compose

Instalación local
-----------------

1. Clonar el repositorio y entrar a la carpeta del proyecto.

2. Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Variables clave en `backend/.env`:

- `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin inicial (solo si no hay admins)
- `SEED_DEFAULT_ADMIN=false` — desactiva el seed
- `REQUIRE_SECRETS=true` — falla al arrancar sin secretos (prod)
- SSO opcional: `SSO_ENABLED`, `SSO_AUTHORIZATION_URL`, `SSO_TOKEN_URL`, `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `SSO_REDIRECT_URI`

3. Frontend (otra terminal):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` debe apuntar al API, por ejemplo `http://localhost:3000/api`.

Docker Compose
--------------

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:3000

Roles (RBAC)
------------
Jerarquía: `viewer` < `operator` < `admin` (cada nivel incluye lo del inferior).

### `viewer` — solo lectura
- Acceso a Home (dashboard, alertas, búsqueda global)
- Consultar User Owners, Configuration Items, Assignments y Letters
- Previsualizar y descargar cartas PDF
- Ver plantilla de carta (solo lectura)
- **No** puede crear, editar, importar, exportar, asignar, devolver ni generar PDF
- **No** ve menú de Auditoría, Settings (edición) ni Administradores

### `operator` — operación diaria
Todo lo de `viewer`, más:
- Crear / editar User Owners y CIs; cambiar status; importar CSV/JSON
- Crear asignaciones, devolver activos, generar cartas PDF (con firma/foto)
- Subir adjuntos; exportar CSV (users, CIs, assignments)
- Ver historial de Auditoría
- En la UI aparecen los botones de escritura (Nuevo, Importar, Exportar, etc.)

### `admin` — administración del sistema
Todo lo de `operator`, más:
- Gestionar cuentas de acceso (`/admins`): crear, eliminar, cambiar roles
- Editar plantilla de carta (empresa, título, texto legal, logo)
- Soft-delete y restore de User Owners y Configuration Items

Inicio de sesión
----------------
Por defecto (si no existía ningún admin):

- Usuario: `admin`
- Contraseña: `admin123` (obligará cambio de contraseña)

Cámbialos en producción.

API principal
-------------
- Auth: `POST /api/auth/login|refresh|logout`, `GET /api/auth/me`, `POST /api/auth/change-password`, SSO `/api/auth/sso/*`
- Users / CIs / Assignments / Letters (paginados donde aplica)
- `GET /api/reports/dashboard`, `GET /api/reports/notifications`
- `GET /api/audit`, `GET /api/search?q=`
- `GET /api/export/users|cis|assignments`
- `GET|PUT /api/settings/letter-template`
- `GET|POST /api/attachments`
- `GET /health` (incluye estado de Mongo)

Los PDFs se sirven solo por `/api/letters/:id/download` (autenticado). `/uploads` ya no es público.

Importación masiva
------------------
Desde la UI (Import / Importar) puedes descargar una plantilla CSV de ejemplo
y subir un CSV o JSON.

### Configuration Items

CSV:

```text
className,serialNumber,brandName,modelName,location,status
Laptop,SN-001,Dell,Latitude,Tegucigalpa,stock
```

Campos requeridos: `className`, `serialNumber`, `brandName`, `modelName`, `location`.

### User Owners

CSV:

```text
name,logonUser,jobDescription,status
Juan Perez,jperez,Analista,active
```

Campos requeridos: `name`, `logonUser`, `jobDescription`.

Flujo de cartas
---------------
1. Crear User Owner y CI en stock.
2. Crear Assignment (firma, foto opcional, PDF en cola).
3. Descargar la carta en Letters, o generar PDF después con «Carta PDF».
4. Ajustar plantilla (logo/textos) en Settings (admin).

Tests
-----

```bash
cd backend
npm run test:unit
# smoke (API levantada):
npm test

cd ../frontend
npm run lint
npm test
npm run build
```

Autor
-----
Yeser Sabillón — @yeser07
