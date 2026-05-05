# BildyApp API

Backend REST para la gestión de albaranes (partes de horas y materiales) entre clientes y proveedores.

## Tecnologías

- **Node.js 20** + Express 5 (ESM modules)
- **MongoDB** + Mongoose
- **Socket.IO** — notificaciones en tiempo real por compañía
- **Cloudinary** — almacenamiento de firmas e imágenes
- **pdfkit** — generación de PDFs
- **Sharp** — optimización de imágenes
- **Nodemailer** — envío de emails de verificación
- **Swagger/OpenAPI 3.0** — documentación interactiva
- **Jest + Supertest + mongodb-memory-server** — testing

---

## Instalación y ejecución local

### Requisitos previos

- Node.js 20+
- MongoDB 7 (local o Atlas)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el fichero de entorno
cp .env.example .env
# → Editar .env con tus valores reales

# 3. Arrancar el servidor
node src/index.js
```

El servidor escucha en `http://localhost:3000` por defecto.

### Variables de entorno

Ver `.env.example` para la lista completa. Variables obligatorias:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3000) |
| `DB_URI` | URI de conexión a MongoDB |
| `JWT_SECRET` | Secreto para tokens de acceso |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `MAIL_HOST` | Host SMTP |
| `MAIL_USER` | Usuario SMTP |
| `MAIL_PASS` | Contraseña SMTP |
| `SLACK_WEBHOOK_URL` | Webhook para notificaciones de errores 5XX |

---

## Ejecución con Docker

```bash
# Levantar app + MongoDB
docker compose up

# En segundo plano
docker compose up -d

# Parar y eliminar contenedores
docker compose down
```

La app se expone en `http://localhost:3000`.  
MongoDB persiste datos en el volumen `mongo_data`.

> Las variables de entorno se leen del fichero `.env` en la raíz del proyecto.

---

## Documentación Swagger

Con el servidor en marcha, accede a la UI interactiva:

```
http://localhost:3000/api-docs
```

---

## Tests

```bash
# Ejecutar todos los tests
npm test

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Con informe de cobertura
npm run test:coverage
```

Los tests usan `mongodb-memory-server` — no requieren MongoDB instalado.  
Cobertura mínima objetivo: **70 %**.

---

## Endpoints principales

| Módulo | Base URL |
|---|---|
| Usuarios | `/api/user` |
| Clientes | `/api/client` |
| Proyectos | `/api/project` |
| Albaranes | `/api/deliverynote` |

Ver `tests.http` para ejemplos de cada endpoint o la UI de Swagger.

---

## Health check

```
GET /health
```

Devuelve estado del servidor, conexión a MongoDB y uptime.

---

## Notificaciones en tiempo real (Socket.IO)

Conectar con JWT:

```js
const socket = io('http://localhost:3000', {
    auth: { token: '<accessToken>' }
});

socket.on('client:new', (data) => { /* ... */ });
socket.on('project:new', (data) => { /* ... */ });
socket.on('deliverynote:new', (data) => { /* ... */ });
socket.on('deliverynote:signed', (data) => { /* ... */ });
```

Los eventos se emiten únicamente a los usuarios de la misma compañía.
