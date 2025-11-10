# NeoCDT - Sistema de Certificados de Depósito a Término

**Materia:** Ingeniería de Software  
**Fecha:** Octubre 2025

---

## 📚 Documentación del Proyecto

Este proyecto cuenta con 3 documentos principales para revisión:

### 1. 📖 [MANUAL_PROYECTO.md](./MANUAL_PROYECTO.md)
**Descripción general del proyecto**
- Funcionalidades (Login, Registro, CDTs)
- Arquitectura del sistema
- Instrucciones de instalación y ejecución
- Rutas del backend y frontend
- Comandos `npm run dev` para ambos

👉 **Empieza aquí para entender el proyecto**

### 2. 🧪 [BACKEND/PRUEBAS_BACKEND.md](./BACKEND/PRUEBAS_BACKEND.md)
**Pruebas y análisis del backend**
- 54 pruebas unitarias (100% aprobadas)
- 52 pruebas funcionales/integración (71% aprobadas)
- Análisis SonarQube (122 issues identificados)
- Instrucciones para ejecutar: `npm test`
- Reportes de cobertura

👉 **Revisar para evaluar calidad del backend**

### 3. 🌐 [FRONTEND/PRUEBAS_FRONTEND.md](./FRONTEND/PRUEBAS_FRONTEND.md)
**Pruebas y análisis del frontend**
- 60 pruebas E2E con Playwright
- Análisis ESLint (16 issues menores)
- Configuración multi-browser (5 navegadores)
- Instrucciones para ejecutar: `npx playwright test`

👉 **Revisar para evaluar calidad del frontend**

---

## 🚀 Inicio Rápido

### Backend
```bash
cd BACKEND
npm install
npm run dev
# Servidor en: http://localhost:5001
```

### Frontend
```bash
cd FRONTEND
npm install
npm run dev
# Aplicación en: http://localhost:5173
```

---

## 📊 Resumen del Proyecto

| Aspecto | Backend | Frontend |
|---------|---------|----------|
| **Tecnología** | Node.js + Express | React 19 + Vite |
| **Base de Datos** | SQLite | - |
| **Tests** | 106 tests (Jest) | 60 tests (Playwright) |
| **Calidad** | 7.0/10 | 8.5/10 |
| **Estado** | ✅ Funcional | ✅ Funcional |

**Total del proyecto:** 166 tests implementados

---

## 📁 Estructura del Proyecto

```
neocdt-project/
├── BACKEND/                      # Servidor Node.js
│   ├── src/                      # Código fuente
│   ├── tests/                    # Pruebas unitarias e integración
│   ├── coverage/                 # Reportes de cobertura
│   ├── PRUEBAS_BACKEND.md       # 📄 Documentación de pruebas backend
│   └── package.json
│
├── FRONTEND/                     # Aplicación React
│   ├── src/                      # Código fuente
│   ├── e2e/                      # Pruebas End-to-End
│   ├── PRUEBAS_FRONTEND.md      # 📄 Documentación de pruebas frontend
│   └── package.json
│
├── MANUAL_PROYECTO.md           # 📄 Manual completo del proyecto
└── README.md                    # Este archivo
```

---

## 🎯 Funcionalidades Implementadas

- ✅ Registro e inicio de sesión
- ✅ Gestión de perfiles de usuario
- ✅ Simulador de CDT
- ✅ Creación y gestión de CDT
- ✅ Panel de administración
- ✅ Sistema de estados de CDT
- ✅ Cálculos financieros automáticos
- ✅ Auditoría de cambios
- ✅ Autenticación con JWT

---

## 🔧 Tecnologías

**Backend:**
- Node.js 18+
- Express.js
- SQLite
- JWT
- Jest + Supertest

**Frontend:**
- React 19
- Vite 7
- Axios
- React Router
- Playwright

---

## 📞 Contacto

Para más información, revisar los 3 documentos principales listados arriba.

**Nota para el profesor:** Todos los comandos de ejecución y rutas correctas están documentados en los archivos .md correspondientes.
