# Manual de instalación y ejecución

**Proyecto:** Stylo — sistema de gestión de salones de eventos
**Materia:** Desarrollo de Software
**Repositorio:** https://github.com/Felicitas26/TP-DesarrolloSoftware.git (rama `main`)
**Stack:** React (frontend) + Express/Prisma (backend) + MySQL (base de datos)

Este documento explica cómo instalar y ejecutar el sistema desde cero, sin necesidad de conocer cómo está desarrollado.

---

## 1. Arquitectura general

El sistema está compuesto por dos aplicaciones independientes que se comunican mediante una API REST:

```
┌────────────────────┐        HTTP/JSON        ┌────────────────────┐        ┌──────────────┐
│  Frontend (React)  │ ─────────────────────▶  │  Backend (Express) │ ─────▶ │  MySQL        │
│  Vite :5173        │ ◀─────────────────────  │  API REST :3000    │ ◀───── │  event_hall   │
└────────────────────┘                         └────────────────────┘        └──────────────┘
```

- **Frontend:** aplicación SPA construida con React + Vite. Se sirve en `http://localhost:5173`.
- **Backend:** API REST construida con Express y Prisma (ORM) sobre MySQL. Escucha en `http://localhost:3000`.
- **Base de datos:** MySQL, base `event_hall`, creada y poblada automáticamente por scripts.

---

## 2. Requisitos previos

Instalar antes de comenzar:

| Herramienta | Versión mínima | Verificación |
|-------------|----------------|--------------|
| Node.js     | 20.19+ (rama 20) o 22.12+ (rama 22) | `node -v` |
| npm         | Incluido con Node.js | `npm -v` |
| MySQL       | 8.0 o superior | `mysql --version` |
| Git         | Cualquier versión reciente | `git --version` |

> Nota: Vite 8 y su plugin de React requieren Node.js `^20.19.0 || >=22.12.0` (rama 20 desde 20.19, o rama 22 desde 22.12). Node 21 y 22.0–22.11 no son compatibles. Recomendado: última 22 LTS.

Asegurarse de que el **servicio de MySQL esté corriendo** antes de continuar. En Windows suele instalarse como servicio; en Linux/macOS puede iniciarse con `sudo service mysql start` o equivalente.

---

## 3. Estructura del proyecto

```
TP-DesarrolloSoftware/
├── Backend/                 # API REST (Express + Prisma)
│   ├── prisma/schema.prisma # Modelo de datos (ORM)
│   ├── scripts/             # setup + seeds (datos de ejemplo)
│   ├── src/                 # rutas, controladores, servicios, modelos
│   ├── server.js            # punto de entrada (puerto 3000)
│   ├── db.js                # pool MySQL de legado (sin uso actual; el acceso real es vía Prisma)
│   └── .env                 # variables de entorno (se crea, NO se versiona)
├── frontend/                # Aplicación React + Vite
│   ├── src/
│   └── package.json
├── database/
│   └── new_event_hall.sql   # referencia del esquema inicial (opcional)
└── README.md
```

---

## Inicio rápido (resumen)

Con MySQL en ejecución y el `Backend/.env` ya creado (ver sección 4.3):

```bash
# Terminal 1 — Backend
cd Backend
npm install
npm run setup
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173` e ingresar con `admin` / `admin123`.

---

## 4. Instalación paso a paso

### 4.1. Clonar el repositorio

```bash
git clone https://github.com/Felicitas26/TP-DesarrolloSoftware.git
cd TP-DesarrolloSoftware
```

> El repositorio **no tiene `package.json` en la raíz** (sólo quedó un `package-lock.json` suelto, heredado de la estructura inicial): el backend y el frontend se instalan y ejecutan por separado, cada uno en su carpeta.

### 4.2. Base de datos MySQL

No es necesario crear tablas a mano: el backend las crea y carga los datos automáticamente.

Sólo hay que asegurarse de tener un usuario de MySQL con permisos para **crear bases de datos** y escribirlo en `DATABASE_URL` del `.env` (sección 4.3). No hay un usuario "por defecto" impuesto por el código: las credenciales se toman de la URL.

> No hace falta importar ningún SQL: el paso 4.3 crea la base y todas las tablas automáticamente. El archivo `database/new_event_hall.sql` es sólo una **referencia del esquema inicial** (puede estar desactualizado). Si preferís usarlo, después ejecutá `npx prisma db push` y `npm run seed:all` para completar el esquema y los datos.

### 4.3. Backend

**1) Crear el archivo de variables de entorno `Backend/.env`:**

Crear un archivo llamado `.env` dentro de la carpeta `Backend` con el siguiente contenido (reemplazar los valores por los de tu instalación de MySQL):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=TU_CONTRASEÑA
DB_NAME=event_hall
DB_PORT=3306

DATABASE_URL="mysql://root:TU_CONTRASEÑA@localhost:3306/event_hall"

JWT_SECRET=UNA_CLAVE_SECRETA_LARGA_Y_ALEATORIA
JWT_EXPIRES_IN=8h

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_usuario_smtp
SMTP_PASS=tu_password_smtp
MAIL_FROM="Stylo <no-reply@example.com>"

FRONTEND_URL=http://localhost:5173
CRON_SECRET=UNA_CLAVE_SECRETA_PARA_EL_CRON
```

> - `DATABASE_URL` es **la única credencial que el sistema usa realmente** (en formato `mysql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE`). Prisma la usa para el ORM, y el script de setup extrae de ahí el host, puerto, usuario y contraseña para crear la base.
> - Las variables `DB_*` son de configuración de legado: el pool de MySQL (`Backend/db.js`) que las leería ya no es consumido por ninguna capa actual del backend. Se mantienen por compatibilidad, pero deben reflejar los mismos datos que `DATABASE_URL` si se van a usar.
> - Si la contraseña contiene caracteres especiales (`@`, `:`, `/`, `#`, etc.), deben codificarse en formato URL (por ejemplo `@` → `%40`) **en `DATABASE_URL`**.
> - Si el usuario de MySQL **no tiene contraseña**, dejar `DB_PASSWORD=` vacío y usar `DATABASE_URL="mysql://root@localhost:3306/event_hall"`.
> - No se exige que el usuario sea `root`: sirve cualquier usuario de MySQL con permisos para **crear bases de datos** (necesario para el paso de setup).
> - `JWT_SECRET` es la clave con la que se firman los tokens de sesión y es **obligatoria**: sin ella el login falla. Usar un valor propio y privado. `JWT_EXPIRES_IN` es opcional (por defecto `8h`).
> - `SMTP_*` y `MAIL_FROM` son **opcionales**: si no se configuran, el sistema sigue funcionando pero omite el envío de mails (sólo registra un aviso en los logs). Para enviar recordatorios y avisos de pago es necesario completarlos. `SMTP_SECURE=true` se usa normalmente con el puerto `465`; con `587` dejarlo en `false`.
> - `FRONTEND_URL` se usa para armar los enlaces incluidos en los mails (por defecto `http://localhost:5173`). En producción debe apuntar a la URL pública del frontend.
> - `CRON_SECRET` protege el endpoint que ejecuta los recordatorios automáticos. Vercel Cron lo envía como `Authorization: Bearer <CRON_SECRET>`; si falta, el endpoint responde `503` y si no coincide, `401`.
> - El archivo `.env` **no se sube al repositorio** (está en `.gitignore`); si trabajás en el mismo entorno del equipo, pedí los valores reales al grupo.

**2) Instalar dependencias:**

```bash
cd Backend
npm install
```

El `postinstall` ejecuta automáticamente `prisma generate` (genera el cliente del ORM).

**3) Preparar la base de datos y cargar los datos de ejemplo:**

```bash
npm run setup
```

Este comando:
1. Crea la base `event_hall` si no existe.
2. Aplica el esquema de Prisma (`prisma db push`), creando todas las tablas.
3. Ejecuta los seeds (ubicaciones, salones, menús, servicios, usuarios, precios y configuración de pagos).

Los seeds son **idempotentes**: si se ejecutan de nuevo no duplican los datos ya existentes.

### 4.4. Frontend

En **otra terminal** (dejando el backend corriendo):

```bash
cd frontend
npm install
npm run dev
```

El frontend se abre en `http://localhost:5173`.

> Opcional: si el backend no está en `http://localhost:3000`, crear `frontend/.env` con:
> ```env
> VITE_API_URL=http://localhost:3000
> ```
> Si no se define, el frontend usa `http://localhost:3000` por defecto.

---

## 5. Ejecución

### Terminal 1 — Backend

```bash
cd Backend
npm run dev
```

- Levanta la API con recarga automática (`nodemon`) en `http://localhost:3000`.
- El script `dev` ejecuta antes `npm run setup` (gracias al hook `predev`), por lo que en la primera ejecución crea la base y carga los datos automáticamente.

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

- Levanta la interfaz en `http://localhost:5173`.

### Acceso al sistema

Abrir el navegador en `http://localhost:5173`.

Credenciales del administrador creadas por el seed:

| Usuario | Contraseña |
|---------|------------|
| `admin` | `admin123` |

Los usuarios **clientes** no vienen con el seed: se registran desde el propio sitio (`POST /api/client` o el formulario de registro). El alta crea además la cuenta de usuario con `rol: "cliente"` y **contraseña inicial temporal igual al DNI** (`passwordTemporal: true`); al cambiarla desde la pantalla de cambio de contraseña se marca como definitiva.

### Recordatorios de pago

Al generar un contrato se crean automáticamente dos cuotas: **Seña** (con vencimiento el día de la reserva) y **Saldo** (con vencimiento el día del evento). El porcentaje de la seña y los días de anticipación para los recordatorios se configuran desde el panel **Gestionar Pagos** (admin → `/payment`) y se guardan en la tabla `Setting`.

Los recordatorios se pueden disparar de dos formas:

- **Manual:** desde el detalle de un contrato o desde el panel de pagos, con el botón de recordatorio.
- **Automático:** el script `npm run reminders` recorre las cuotas pendientes cuyo evento está dentro de la ventana configurada y envía el mail al cliente (sólo una vez por cuota).

En producción, `Backend/vercel.json` declara un **Vercel Cron** que ejecuta `GET /api/payment/reminders/run` todos los días a las 12:00 UTC. Vercel agrega automáticamente el header `Authorization: Bearer <CRON_SECRET>`; por eso `CRON_SECRET` debe estar definido también en las variables de entorno del proyecto en Vercel. Para probarlo manualmente:

```bash
curl -H "Authorization: Bearer TU_CRON_SECRET" http://localhost:3000/api/payment/reminders/run
```

### Reporte de pagos y plantillas de email

El cliente puede **informar un pago** desde el detalle de su contrato (`POST /api/payment/:id/report`). El aviso incluye fecha de pago, medio, referencia, notas y, opcionalmente, un comprobante en imagen o PDF de hasta 5 MB. Mientras el reporte está pendiente, la cuota sigue en estado `pendiente` y no se envían recordatorios.

El administrador revisa los reportes desde **Gestionar Pagos → Reportados** o desde el detalle del contrato:

- **Confirmar:** marca la cuota como `seña` si el concepto es la seña, o `pagado` en caso contrario. Usa la fecha informada por el cliente y envía el email de pago confirmado.
- **Rechazar:** requiere un motivo, notifica al cliente y le permite volver a informar el pago.

Los emails de pagos usan plantillas editables desde **Gestionar Pagos → Mensajes de email**:

- `payment_pending`: pago pendiente registrado.
- `payment_reminder`: recordatorio de pago.
- `payment_confirmed`: pago confirmado.

Cada plantilla tiene asunto y cuerpo. Se pueden usar placeholders como `{{cliente}}`, `{{contrato}}`, `{{concepto}}`, `{{monto}}`, `{{vencimiento}}`, `{{fechaEvento}}`, `{{fechaPago}}`, `{{salon}}`, `{{enlace}}`, `{{titulo}}` y `{{mensaje}}`. El botón **Ver mi contrato** y el diseño HTML son fijos. La opción **Restaurar predeterminadas** vuelve a cargar los textos originales.

Endpoints principales:

```text
POST /api/payment/:id/report                  (cliente autenticado)
POST /api/payment/:id/report/confirm          (admin)
POST /api/payment/:id/report/reject           (admin)
GET  /api/payment/reported/count              (admin)
GET  /api/payment/email-templates             (admin)
PUT  /api/payment/email-templates             (admin)
POST /api/payment/email-templates/reset       (admin)
```

Para generar datos aleatorios de prueba:

```bash
cd Backend
npm run seed:random -- --clients 10 --reset
npm run seed:random -- --clients 5 --seed 12345
npm run seed:random -- --reset-only
```

Los clientes demo usan emails con formato `nombre.apellido@gmail.com`, por ejemplo `lucia.gomez@gmail.com`, y contraseña `demo123`. `--reset` elimina sólo datos demo antes de crear los nuevos; `--reset-only` sólo limpia. Los reportes de pago se excluyen de los recordatorios automáticos.

---

## 6. Scripts disponibles

### Backend (`cd Backend`)

| Script | Descripción |
|--------|-------------|
| `npm run setup` | Crea la base, aplica el esquema y ejecuta todos los seeds. |
| `npm run dev` | Inicia el servidor en modo desarrollo (`nodemon`). Antes ejecuta `setup`. |
| `npm start` | Inicia el servidor en modo normal (sin setup ni recarga). |
| `npm run seed:all` | Ejecuta todos los seeds sin recrear el esquema. |
| `npm run seed:locations` | Carga sólo las ubicaciones (ciudades). |
| `npm run seed:usuarios` | Carga sólo los usuarios (administrador). |
| `npm run seed:prices` | Carga sólo los precios. |
| `npm run seed:settings` | Carga la configuración de pagos (porcentaje de seña, días de recordatorio, recordatorios activos). |
| `npm run seed:email-templates` | Carga las plantillas predeterminadas de email de pagos. |
| `npm run seed:random -- --clients 10 --reset` | Genera clientes, reservas, contratos y pagos demo aleatorios. |
| `npm run seed:random -- --reset-only` | Elimina sólo los datos demo generados por el seed aleatorio. |
| `npm run reminders` | Ejecuta manualmente el envío de recordatorios de pago pendientes. |

### Frontend (`cd frontend`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173`. |
| `npm run build` | Genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve localmente la build de producción. |
| `npm run lint` | Analiza el código con ESLint. |

---

## 7. Verificación rápida

1. El backend muestra `Server running on port 3000`.
2. Al abrir `http://localhost:3000/api/locations` en el navegador se obtiene un JSON con las ciudades.
3. La documentación de la API está disponible en `http://localhost:3000/api-docs`.
4. El frontend abre en `http://localhost:5173`.
5. Se puede iniciar sesión con `admin` / `admin123`.

---

## 8. Documentación de la API

La API está documentada con el estándar **OpenAPI 3.0** y se expone mediante **Swagger UI**:

| Recurso | URL |
|---------|-----|
| Swagger UI (interactivo) | `http://localhost:3000/api-docs` |
| Especificación OpenAPI (JSON) | `http://localhost:3000/api-docs.json` |

Desde Swagger UI se pueden explorar todos los endpoints, ver los esquemas de request/response y ejecutar peticiones contra la API.

Para probar rutas protegidas:

1. Ejecutar `POST /api/auth/login` con `{ "username": "admin", "password": "admin123" }`.
2. Copiar el `token` de la respuesta.
3. Usar el botón **Authorize** (arriba a la derecha) e ingresar `Bearer <token>`.

La especificación vive en `Backend/src/docs/openapi.js`.

---

## 9. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `Error connecting to the database` / `Access denied` | MySQL no está corriendo o credenciales incorrectas en `.env`. | Verificar el servicio de MySQL y revisar `DB_USER`, `DB_PASSWORD` y `DATABASE_URL`. |
| `Can't reach database server` al correr `setup` | Host/puerto incorrectos. | Revisar `DB_HOST` y `DB_PORT` (por defecto `localhost:3306`). |
| `The table ... does not exist` | No se aplicó el esquema. | Ejecutar `npm run setup` en `Backend`. |
| `EADDRINUSE: port 3000` | Ya hay otro proceso usando el puerto 3000. | Cerrar el proceso anterior o cambiar el puerto en `Backend/server.js`. |
| `EADDRINUSE: port 5173` | Ya hay otro Vite corriendo. | Cerrar la otra terminal o usar `npm run dev -- --port 5174`. |
| El frontend carga pero no trae datos | El backend no está corriendo o está en otro puerto. | Verificar que el backend esté en `http://localhost:3000` o definir `VITE_API_URL`. |
| Error de versión de Node al iniciar el frontend | Node.js desactualizado o en una rama no soportada (21.x / 22.0–22.11). | Instalar Node.js 20.19+ (rama 20) o 22.12+ (rama 22). |
| `Prisma Client did not initialize` | No se ejecutó `prisma generate`. | Ejecutar `npm install` en `Backend` o `npx prisma generate`. |
| No llegan los mails de pago/recordatorio | `SMTP_*` o `MAIL_FROM` no configurados o credenciales inválidas. | Completar las variables SMTP en `Backend/.env`, revisar los logs del backend y reiniciar. |
| El endpoint de recordatorios responde `401` o `503` | Falta `CRON_SECRET` o el header `Authorization` no coincide. | Definir `CRON_SECRET` en el entorno y enviar `Authorization: Bearer <CRON_SECRET>`. |
| No se generan las cuotas Seña/Saldo al crear un contrato | No se ejecutó el seed de configuración o el porcentaje está en `0`/`100`. | Ejecutar `npm run seed:settings` o ajustar el porcentaje desde **Gestionar Pagos**. |
| Error al hacer login (500) | Falta `JWT_SECRET` en `Backend/.env`. | Agregar `JWT_SECRET` al `.env` y reiniciar el backend. |
| No aparecen ciudades en el formulario | Seed de ubicaciones no ejecutado. | Ejecutar `npm run seed:locations` en `Backend`. |
| Error `EPERM` al ejecutar `npx prisma generate` | El backend está corriendo y bloquea el motor de Prisma en Windows. | Detener el backend, ejecutar `npx prisma generate` y volver a iniciarlo. |
| No se puede informar un pago | La cuota no está pendiente, ya tiene un reporte pendiente o el cliente no es el dueño del contrato. | Revisar el estado de la cuota y el usuario autenticado. |
| No se puede eliminar una cuota | Tiene un reporte pendiente de revisión. | Confirmar o rechazar el reporte primero. |
| No aparecen las plantillas de email | No se ejecutó el seed o la tabla `EmailTemplate` no existe. | Ejecutar `npx prisma db push` y `npm run seed:email-templates`. |
| El seed random no crea datos | Faltan localidades o salones base. | Ejecutar `npm run seed:all` antes de `npm run seed:random`. |

---

## 10. Notas

- El archivo `Backend/.env` es privado y no se versiona; cada entorno debe crear el suyo.
- Las imágenes subidas por los usuarios se guardan en `Backend/uploads/` y se sirven en `/uploads`.
- Los seeds pueden ejecutarse varias veces sin duplicar información.
- Ante cualquier error de conexión, verificar primero que MySQL esté activo y que `Backend/.env` tenga los datos correctos.
