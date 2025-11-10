# Manual del Proyecto - NeoCDT

**Estudiantes:** Jose Miguel Galeano Serna 2230423  
                 David Astudillo Palma 2231650
                 Gabriel Armando Gil
                 Jose David Aguirre 
**Fecha:** 17 de octubre de 2025  
**Materia:** Ingeniería de Software

---

## 📋 Contenido

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Funcionalidades Principales](#funcionalidades-principales)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Instalación y Ejecución](#instalación-y-ejecución)
5. [Uso de la Aplicación](#uso-de-la-aplicación)

---

## Descripción del Proyecto

**NeoCDT** es un sistema web para la gestión de Certificados de Depósito a Término (CDT), que permite a los usuarios simular, crear y administrar sus inversiones en CDT de manera digital.

### Objetivo

Proporcionar una plataforma segura y eficiente para que los clientes de una entidad financiera puedan:
- Simular inversiones en CDT
- Crear y gestionar sus CDT
- Consultar el estado de sus inversiones
- Realizar operaciones de renovación y cancelación

### Tecnologías Utilizadas

#### Backend
- **Node.js** v18+ con Express.js
- **Base de datos:** SQLite
- **Autenticación:** JWT (JSON Web Tokens)
- **Validación:** Express Validator
- **Testing:** Jest + Supertest

#### Frontend
- **React** 19.1.1
- **Build Tool:** Vite 7.1.7
- **HTTP Client:** Axios
- **Routing:** React Router DOM
- **Testing E2E:** Playwright

---

## Funcionalidades Principales

### 1. Sistema de Autenticación

#### Registro de Usuario

**Ruta:** `POST /api/v1/auth/register`

El sistema permite registrar nuevos usuarios con la siguiente información:

**Datos requeridos:**
```json
{
  "documentType": "CC",              // CC, CE, PA
  "documentNumber": "1234567890",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "3001234567",
  "password": "MiPassword123!",
  "confirmPassword": "MiPassword123!"
}
```

**Datos opcionales (para extranjeros):**
```json
{
  "nationality": "Venezuela",
  "residenceDate": "2023-01-15"
}
```

**Validaciones:**
- Email único en el sistema
- Contraseña mínima de 8 caracteres
- Formato válido de email
- Confirmación de contraseña debe coincidir

**Respuesta exitosa:**
```json
{
  "status": "success",
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "usr_abc123",
      "name": "Juan Pérez",
      "email": "juan@example.com"
    }
  }
}
```

#### Login (Inicio de Sesión)

**Ruta:** `POST /api/v1/auth/login`

**Datos requeridos:**
```json
{
  "documentType": "CC",
  "documentNumber": "1234567890",
  "password": "MiPassword123!"
}
```

**Respuesta exitosa:**
```json
{
  "status": "success",
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "usr_abc123",
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Tokens:**
- **Access Token:** Válido por 1 hora, se usa en cada petición
- **Refresh Token:** Válido por 7 días, se usa para renovar el access token

#### Logout (Cerrar Sesión)

**Ruta:** `POST /api/v1/auth/logout`

Invalida el refresh token del usuario.

### 2. Gestión de CDT (Certificados de Depósito a Término)

#### Simulador de CDT

**Ruta Frontend:** `/simular-cdt` (acceso público)

Permite calcular el retorno de inversión antes de crear un CDT.

**Parámetros de simulación:**
- **Monto:** Entre $500,000 y $500,000,000 COP
- **Plazo:** Entre 30 y 360 días
- **Tasa de interés:** Automática según plazo en días

**Tasas de Interés:**
| Plazo (días) | Tasa Anual |
|--------------|------------|
| 30-90 días | 8.5% |
| 91-180 días | 9.5% |
| 181-270 días | 10.5% |
| 271-360 días | 11.5% |

**Cálculo de retorno:**
```javascript
// Fórmula: Monto × (Tasa/100) × (Días/360)
retorno = monto × (tasa / 100) × (dias / 360)
valorFinal = monto + retorno
```

**Ejemplo:**
- Monto: $10,000,000
- Plazo: 360 días
- Tasa: 9.5%
- Retorno: $950,000
- Valor final: $10,950,000

#### Crear CDT

**Ruta:** `POST /api/v1/cdts`  
**Requiere:** Autenticación (token)

**Datos requeridos:**
```json
{
  "amount": 10000000,            // Monto en COP
  "termDays": 360,               // Plazo en días (30-360)
  "startDate": "2025-10-20",     // Fecha de inicio
  "renovationOption": "capital"  // "capital" o "capital_interest"
}
```

**Opciones de renovación:**
- `capital`: Renovar solo el capital (retira intereses)
- `capital_interest`: Renovar capital + intereses

**Estados de un CDT:**
1. **draft:** Borrador, puede editarse
2. **pending:** En revisión (enviado para aprobación)
3. **active:** Aprobado y activo
4. **cancelled:** Cancelado por el usuario
5. **rejected:** Rechazado por el admin
6. **matured:** Vencido

**Flujo de creación:**
```
1. Usuario crea CDT → Estado: draft
2. Usuario envía a revisión → Estado: pending
3. Admin aprueba → Estado: active
4. Al vencimiento → Estado: matured
```

#### Listar Mis CDT

**Ruta:** `GET /api/v1/cdts/my-cdts`  
**Requiere:** Autenticación

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "cdts": [
      {
        "id": "cdt_xyz789",
        "amount": 10000000,
        "termDays": 360,
        "interestRate": 9.5,
        "startDate": "2025-10-20",
        "endDate": "2026-10-20",
        "status": "active",
        "expectedReturn": 950000,
        "finalAmount": 10950000
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10
    }
  }
}
```

#### Ver Detalles de CDT

**Ruta:** `GET /api/v1/cdts/:id`  
**Requiere:** Autenticación

Muestra información completa del CDT incluyendo cálculos y auditoría.

#### Cancelar CDT

**Ruta:** `POST /api/v1/cdts/:id/cancel`  
**Requiere:** Autenticación

**Datos requeridos:**
```json
{
  "reason": "Necesito el dinero para emergencia"
}
```

**Nota:** Solo se pueden cancelar CDT en estado `active` o `pending`.

#### Panel de Administración (Admin)

**Rutas exclusivas para administradores:**

1. **Ver CDTs pendientes:**
   - `GET /api/v1/cdts/admin/pending`
   
2. **Aprobar CDT:**
   - `POST /api/v1/cdts/:id/approve`
   
3. **Rechazar CDT:**
   - `POST /api/v1/cdts/:id/reject`
   ```json
   {
     "adminNotes": "Monto fuera de política"
   }
   ```

4. **Estadísticas:**
   - `GET /api/v1/cdts/admin/stats`
   - Retorna: total CDTs, por estado, montos totales, etc.

---

## Arquitectura del Sistema

### Estructura del Backend

```
BACKEND/
├── src/
│   ├── app.js                    # Configuración de Express
│   ├── config/
│   │   ├── database.js           # Conexión SQLite
│   │   ├── env.js                # Variables de entorno
│   │   └── financialRules.js     # Reglas de CDT (tasas, límites)
│   │
│   ├── controllers/              # Lógica de endpoints
│   │   ├── authController.js     # Login, registro, logout
│   │   ├── cdtController.js      # CRUD de CDT
│   │   └── userController.js     # Gestión de usuarios
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── authService.js        # Autenticación
│   │   ├── cdtService.js         # Cálculos y validaciones CDT
│   │   └── userService.js        # Operaciones de usuario
│   │
│   ├── models/                   # Acceso a base de datos
│   │   ├── userModel.js          # Modelo de usuarios
│   │   └── cdtModel.js           # Modelo de CDT
│   │
│   ├── middlewares/              # Middlewares de Express
│   │   ├── authMiddleware.js     # Validación de JWT
│   │   ├── errorHandler.js       # Manejo de errores
│   │   └── rateLimiter.js        # Límite de peticiones
│   │
│   ├── validators/               # Validaciones de entrada
│   │   ├── authValidatorNew.js
│   │   ├── cdtValidatorNew.js
│   │   └── userValidatorNew.js
│   │
│   ├── routes/                   # Definición de rutas
│   │   ├── authRoutes.js
│   │   ├── cdtRoutes.js
│   │   └── userRoutes.js
│   │
│   └── utils/                    # Utilidades
│       ├── jwt.js                # Generación/validación tokens
│       ├── logger.js             # Sistema de logs
│       └── cache.js              # Caché en memoria
│
├── tests/                        # Pruebas automatizadas
│   ├── unit/                     # Pruebas unitarias
│   └── integration/              # Pruebas de integración
│
├── server.js                     # Punto de entrada
└── package.json                  # Dependencias
```

### Estructura del Frontend

```
FRONTEND/
├── src/
│   ├── pages/                    # Páginas de la aplicación
│   │   ├── Home.jsx              # Página principal
│   │   ├── Login.jsx             # Inicio de sesión
│   │   ├── Register.jsx          # Registro de usuario
│   │   ├── Dashboard.jsx         # Panel de usuario
│   │   ├── CDTSimulator.jsx      # Simulador
│   │   ├── CreateCDT.jsx         # Crear CDT
│   │   ├── CDTDetails.jsx        # Detalles de CDT
│   │   ├── UserProfile.jsx       # Perfil de usuario
│   │   ├── AccountStatement.jsx  # Estado de cuenta
│   │   ├── AdminPanel.jsx        # Panel de admin
│   │   ├── CanalesAtencion.jsx   # Página informativa
│   │   └── Transparencia.jsx     # Página informativa
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── HeaderFixed.jsx       # Encabezado
│   │   ├── Toast.jsx             # Notificaciones
│   │   ├── ConfirmSubmitModal.jsx # Modal de confirmación
│   │   ├── RejectCDTModal.jsx    # Modal de rechazo
│   │   └── CDTStatusBadge.jsx    # Badge de estado
│   │
│   ├── utils/                    # Utilidades
│   │   ├── api.js                # Cliente HTTP (Axios)
│   │   └── localStorageUtils.js  # Manejo de localStorage
│   │
│   ├── App.jsx                   # Componente raíz
│   └── main.jsx                  # Punto de entrada
│
├── e2e/                          # Tests End-to-End
│   ├── auth.spec.js
│   ├── cdt.spec.js
│   └── navigation.spec.js
│
├── index.html                    # HTML principal
├── vite.config.js                # Configuración de Vite
└── package.json                  # Dependencias
```

---

## Instalación y Ejecución

### Requisitos Previos

```bash
# Verificar versiones instaladas
node --version    # Debe ser v18 o superior
npm --version     # Debe ser v9 o superior
```

### 1. Clonar o Descargar el Proyecto

```bash
# Navegar a la carpeta del proyecto
cd C:/Users/infoj/Downloads/ingsoft/ingsoft/neocdt-project
```

### 2. Configurar el Backend

```bash
# Navegar a la carpeta del backend
cd BACKEND

# Instalar dependencias
npm install

# Crear archivo de variables de entorno (si no existe)
# No es necesario, hay valores por defecto

# Iniciar servidor en modo desarrollo
npm run dev
```

**Salida esperada:**
```
🚀 Servidor corriendo en http://localhost:5001
📊 Base de datos: SQLite conectada
✅ Todas las rutas cargadas
```

**El backend estará disponible en:**
```
http://localhost:5001
API: http://localhost:5001/api/v1
```

### 3. Configurar el Frontend

```bash
# Abrir una NUEVA terminal
# Navegar a la carpeta del frontend
cd C:/Users/infoj/Downloads/ingsoft/ingsoft/neocdt-project/FRONTEND

# Instalar dependencias
npm install

# Iniciar aplicación en modo desarrollo
npm run dev
```

**Salida esperada:**
```
  VITE v7.1.7  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**La aplicación estará disponible en:**
```
http://localhost:5173
```

### 4. Verificar que Todo Funciona

1. **Backend:** Abrir `http://localhost:5001/api/v1` en el navegador
2. **Frontend:** Abrir `http://localhost:5173` en el navegador

**Importante:** Ambos servidores deben estar corriendo simultáneamente.

---

## Uso de la Aplicación

### Flujo de Uso Completo

#### 1. Registro de Usuario

1. Abrir `http://localhost:5173`
2. Click en "Registrarse"
3. Llenar formulario:
   - Tipo de documento: CC
   - Número: 1234567890
   - Nombre: Juan Pérez
   - Email: juan@example.com
   - Teléfono: 3001234567
   - Contraseña: MiPassword123!
4. Click en "Registrar"
5. Redirige automáticamente al login

#### 2. Iniciar Sesión

1. En la página de login, ingresar:
   - Tipo documento: CC
   - Número: 1234567890
   - Contraseña: MiPassword123!
2. Click en "Iniciar Sesión"
3. Redirige al Dashboard

#### 3. Simular CDT

1. Desde el Dashboard, click en "Simular CDT"
2. Ingresar datos:
   - Monto: $10,000,000
   - Plazo: 12 meses
3. Ver resultado:
   - Tasa de interés: 9.5%
   - Interés a ganar: $950,000
   - Valor final: $10,950,000
4. Click en "Crear CDT" (lleva al formulario)

#### 4. Crear CDT

1. Formulario pre-llenado con datos de simulación
2. Seleccionar:
   - Fecha de inicio
   - Opción de renovación (capital o capital+intereses)
3. Click en "Crear CDT"
4. El CDT queda en estado "Borrador"

#### 5. Enviar CDT a Revisión

1. Desde "Mis CDT", click en el CDT creado
2. Revisar detalles
3. Click en "Enviar a Revisión"
4. El CDT pasa a estado "Pendiente"

#### 6. Aprobar CDT (Admin)

1. Iniciar sesión como admin
2. Ir a "Panel de Administración"
3. Ver lista de CDT pendientes
4. Click en "Aprobar"
5. El CDT pasa a estado "Activo"

#### 7. Consultar Estado de Cuenta

1. Desde el Dashboard, click en "Estado de Cuenta"
2. Ver lista de todos los CDT
3. Filtrar por estado (Activo, Pendiente, etc.)

#### 8. Cancelar CDT

1. Ir a detalles del CDT
2. Click en "Cancelar CDT"
3. Ingresar razón de cancelación
4. Confirmar
5. El CDT pasa a estado "Cancelado"

### Rutas de la Aplicación

#### Rutas Públicas (sin autenticación)
- `/` - Página principal
- `/login` - Inicio de sesión
- `/register` - Registro de usuario
- `/simular-cdt` - Simulador de CDT
- `/canales` - Canales de atención
- `/transparencia` - Información de transparencia

#### Rutas Privadas (requieren autenticación)
- `/dashboard` - Panel de usuario
- `/perfil` - Perfil de usuario
- `/crear-cdt` - Crear nuevo CDT
- `/cdt/:id` - Detalles de un CDT
- `/estado-cuenta` - Estado de cuenta

#### Rutas de Admin (requieren rol admin)
- `/admin/solicitudes` - Panel de administración

---

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Registrar nuevo usuario |
| POST | `/api/v1/auth/login` | Iniciar sesión |
| POST | `/api/v1/auth/logout` | Cerrar sesión |
| POST | `/api/v1/auth/refresh` | Renovar access token |

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/users/me` | Obtener perfil actual |
| PATCH | `/api/v1/users/me` | Actualizar perfil |

### CDT

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/cdts/my-cdts` | Listar mis CDT |
| GET | `/api/v1/cdts/:id` | Obtener CDT por ID |
| POST | `/api/v1/cdts` | Crear nuevo CDT |
| PATCH | `/api/v1/cdts/:id` | Actualizar CDT (draft) |
| POST | `/api/v1/cdts/:id/submit` | Enviar a revisión |
| POST | `/api/v1/cdts/:id/cancel` | Cancelar CDT |
| GET | `/api/v1/cdts/:id/audit` | Ver auditoría |

### CDT Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/cdts/admin/pending` | CDTs pendientes |
| GET | `/api/v1/cdts/admin/all` | Todos los CDT |
| GET | `/api/v1/cdts/admin/stats` | Estadísticas |
| POST | `/api/v1/cdts/:id/approve` | Aprobar CDT |
| POST | `/api/v1/cdts/:id/reject` | Rechazar CDT |

---

## Notas Finales

### Usuarios de Prueba

**Usuario Regular:**
- Tipo doc: CC
- Número: 1234567890
- Password: User123!

**Usuario Admin:**
- Tipo doc: CC
- Número: 9876543210
- Password: Admin123!

### Base de Datos

- **Ubicación:** `BACKEND/src/database/neocdt.db`
- **Tipo:** SQLite
- **Se crea automáticamente** al iniciar el backend por primera vez

### Puertos Utilizados

- **Backend:** 5001
- **Frontend:** 5173

**Nota:** Si algún puerto está ocupado, modificar en:
- Backend: `BACKEND/src/config/env.js`
- Frontend: `FRONTEND/vite.config.js`

### Comandos Útiles

```bash
# Backend
npm run dev          # Iniciar servidor desarrollo
npm test            # Ejecutar pruebas
npm run lint        # Verificar código

# Frontend
npm run dev         # Iniciar aplicación desarrollo
npm run build       # Construir para producción
npm run preview     # Vista previa de producción
npx playwright test # Ejecutar tests E2E
npm run lint        # Verificar código
```

---

**Proyecto desarrollado para la materia de Ingeniería de Software**  
**Fecha:** Octubre 2025
