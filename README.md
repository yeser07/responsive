CI Manager – Cartas Responsivas
================================

Aplicación web para gestionar User Owners, Configuration Items (activos),
asignaciones y cartas responsivas en PDF.

Arquitectura
------------
- `backend/` — Node.js, Express 5, MongoDB (Mongoose), JWT, Puppeteer, Handlebars
- `frontend/` — Vue 3, Vite, Vue Router, Axios, Bootstrap 5, SweetAlert2, vue3-easy-data-table

Requisitos
----------
- Node.js 18+
- MongoDB en ejecución (por defecto `mongodb://localhost:27017`)

Instalación
-----------

1. Clonar el repositorio y entrar a la carpeta del proyecto.

2. Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Variables en `backend/.env`:

- `PORT` — puerto del API (3000)
- `MONGO_URI` — URI de MongoDB
- `JWT_SECRET` — secreto para firmar tokens
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — admin inicial (se crea solo si no hay admins)

3. Frontend (otra terminal):

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

`VITE_API_URL` debe apuntar al API, por ejemplo `http://localhost:3000/api`.

Inicio de sesión
----------------
Por defecto (si no existía ningún admin):

- Usuario: `admin`
- Contraseña: `admin123`

Cámbialos en producción.

API principal
-------------
- `POST /api/auth/login`
- `GET|POST /api/users`, `POST /api/users/import`, `PUT /api/users/:id/status`
- `GET|POST /api/cis`, `POST /api/cis/import`, `PUT /api/cis/:id/status`
- `GET|POST /api/assignments`, `PUT /api/assignments/:id/return`, `POST /api/assignments/:id/letter`
- `GET /api/letters`, `GET /api/letters/:id/download`
- `GET /health` (sin auth)

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

JSON (`POST /api/cis/import`):

```json
{
  "items": [
    {
      "className": "Laptop",
      "serialNumber": "SN-001",
      "brandName": "Dell",
      "modelName": "Latitude",
      "location": "Tegucigalpa",
      "status": "stock"
    }
  ]
}
```

Campos requeridos: `className`, `serialNumber`, `brandName`, `modelName`, `location`.
`status` opcional (`In use`, `stock`, `retired`, `missing`, `damaged`; default `stock`).

### User Owners

CSV:

```text
name,logonUser,jobDescription,status
Juan Perez,jperez,Analista,active
```

JSON (`POST /api/users/import`):

```json
{
  "items": [
    {
      "name": "Juan Perez",
      "logonUser": "jperez",
      "jobDescription": "Analista",
      "status": "active"
    }
  ]
}
```

Campos requeridos: `name`, `logonUser`, `jobDescription`.
`status` opcional (`active`, `inactive`; default `active`).

Flujo de cartas
---------------
1. Crear User Owner y CI en stock.
2. Crear Assignment (opcionalmente generando PDF).
3. Descargar la carta en Letters, o generar PDF después con “Carta PDF”.

Tests smoke
-----------

```bash
cd backend
npm test
```

El script `npm test` ejecuta `tests/smoke.test.js` contra un servidor ya levantado
(`BASE_URL`, por defecto `http://localhost:3000`).

Autor
-----
Yeser Sabillón – @yeser07
