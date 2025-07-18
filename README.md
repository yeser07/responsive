CI Manager – Aplicación de Cartas Responsivas
=============================================

CI Manager es una aplicación web para la gestión de cartas responsivas de activos asignados a usuarios. 
Administra UserOwners, Configuration Items, asignaciones y las Cartas Responsivas

Tecnologías usadas
------------------
Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)
- dotenv
- CORS

Frontend:
- Vite
- Vue.js
- Vue Router
- Axios
- Bootstrap (o BootstrapVue)

Estructura del proyecto
------------------------

/responsive
├── /backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── .env
│   └── server.js
├── /frontend
│   ├── src/
│   ├── public/
│   └── package.json
└── README_CARTAS_RESPONSIVAS.txt

Instalación y ejecución
-----------------------
1. Clonar el repositorio:

git clone https://github.com/tuusuario/responsive.git
cd responsive

2. Backend

cd backend
npm install

Crea un archivo .env en la carpeta backend con el siguiente contenido:

PORT=3000
MONGO_URI=mongodb://localhost:27017/responsive

Inicia el servidor:

npm run dev

3. Frontend

cd ../frontend
npm install
npm run dev


Notas
-----
- Asegúrate de que MongoDB esté corriendo localmente en el puerto por defecto (27017).
- Si deseas desplegar en producción, configura correctamente tus variables de entorno.

Autor
-----
Yeser Sabillón – @yeser07
