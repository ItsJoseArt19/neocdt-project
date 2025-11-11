# Historias de Usuario con Criterios de Aceptación Gherkin - NeoCDT

**Proyecto:** Sistema de Gestión de CDTs Bancarios  
**Fecha:** 11 de noviembre de 2025  
**Materia:** Ingeniería de Software  
**Versión:** 2.0 - Actualizado según implementación real

---

## 📋 Índice de Historias de Usuario

### 🔐 Módulo: Autenticación
1. [HU-01: Login del Cliente](#hu-01-login-del-cliente)
2. [HU-02: Registro de Usuario](#hu-02-registro-de-usuario)
3. [HU-07: Cerrar Sesión](#hu-07-cerrar-sesión)

### 💰 Módulo: Gestión de CDTs (Usuario)
4. [HU-08: Simulador de CDT](#hu-08-simulador-de-cdt)
5. [HU-03: Crear Solicitud de CDT](#hu-03-crear-solicitud-de-cdt)
6. [HU-09: Editar CDT en Borrador](#hu-09-editar-cdt-en-borrador)
7. [HU-04: Enviar a Validación](#hu-04-enviar-a-validación)
8. [HU-05: Listar y Filtrar CDTs](#hu-05-listar-y-filtrar-cdts)
9. [HU-06: Ver Detalle y Bitácora](#hu-06-ver-detalle-y-bitácora)
10. [HU-10: Cancelar CDT](#hu-10-cancelar-cdt)

### 👨‍💼 Módulo: Administración
11. [HU-13: Dashboard Admin](#hu-13-dashboard-admin)
12. [HU-11: Aprobar CDT (Admin)](#hu-11-aprobar-cdt-admin)
13. [HU-12: Rechazar CDT (Admin)](#hu-12-rechazar-cdt-admin)

### 📊 Módulo: Reportes
14. [HU-14: Ver Estado de Cuenta](#hu-14-ver-estado-de-cuenta)

---

## 🔐 MÓDULO: AUTENTICACIÓN

---

## HU-01: Login del Cliente

**Como** cliente bancario  
**Quiero** iniciar sesión con mis credenciales (tipo documento, número, contraseña)  
**Para** acceder de forma segura a mis Solicitudes de CDT

**Prioridad:** Alta  
**Endpoints:** `POST /api/v1/auth/login`  
**Archivos:** `authRoutes.js`, `authController.js`, `Login.jsx`

### Criterios de Aceptación

```gherkin
Feature: Login del cliente
  Como cliente bancario
  Quiero iniciar sesión con mis credenciales
  Para acceder a las funcionalidades del sistema de CDT

  Background:
    Given que estoy en la página de login
    And existe un usuario con las siguientes credenciales:
      | tipo_documento   | CC              |
      | numero_documento | 67040168        |
      | contraseña       | Admin123!       |
      | rol              | admin           |

  Scenario: Login exitoso con credenciales válidas
    When ingreso las siguientes credenciales:
      | tipo_documento   | CC           |
      | numero_documento | 67040168     |
      | contraseña       | Admin123!    |
    And hago clic en el botón "Ingresar"
    Then debería ver el mensaje "Inicio de sesión exitoso"
    And debería ser redirigido al dashboard
    And debería ver mi nombre "Admin" en el header
    And debería tener un token JWT válido en localStorage
    And el token debería expirar en 15 minutos
    And debería tener un refresh token válido por 7 días

  Scenario: Login exitoso con usuario regular
    Given que existe un usuario regular:
      | tipo_documento   | CC           |
      | numero_documento | 12345678     |
      | contraseña       | User123!     |
      | rol              | user         |
    When ingreso las credenciales del usuario regular
    And hago clic en "Ingresar"
    Then debería ser autenticado exitosamente
    And no debería tener acceso a rutas de administrador
    And solo debería ver mis propios CDTs

  Scenario: Intento de login con contraseña incorrecta
    When ingreso las siguientes credenciales:
      | tipo_documento   | CC              |
      | numero_documento | 67040168        |
      | contraseña       | WrongPassword!  |
    And hago clic en el botón "Ingresar"
    Then debería ver el mensaje de error "Credenciales inválidas"
    And no debería ser autenticado
    And no debería tener un token de sesión

  Scenario: Intento de login con usuario inexistente
    When ingreso las siguientes credenciales:
      | tipo_documento   | CC           |
      | numero_documento | 99999999     |
      | contraseña       | Password123! |
    And hago clic en el botón "Ingresar"
    Then debería ver el mensaje de error "Credenciales inválidas"
    And no debería ser autenticado

  Scenario: Validación de campos obligatorios
    When dejo el campo "tipo_documento" vacío
    And hago clic en el botón "Ingresar"
    Then debería ver el mensaje "El tipo de documento es requerido"
    And no debería ser enviada la petición al servidor

  Scenario: Rate limiting - Protección contra fuerza bruta
    Given que he intentado iniciar sesión 5 veces con contraseña incorrecta
    When intento iniciar sesión por sexta vez
    Then debería ver el mensaje "Demasiadas solicitudes"
    And debería recibir un código de estado 429

  Scenario: Persistencia de sesión después de recargar página
    Given que he iniciado sesión exitosamente
    When recargo la página
    Then debería seguir autenticado
    And debería ver mi información en el dashboard
```

---

## HU-02: Registro de Usuario

**Como** cliente bancario  
**Quiero** registrarme con mis datos personales  
**Para** crear mi cuenta y poder solicitar CDTs

**Prioridad:** Alta  
**Endpoints:** `POST /api/v1/auth/register`  
**Archivos:** `authRoutes.js`, `authController.js`, `Register.jsx`

### Criterios de Aceptación

```gherkin
Feature: Registro de nuevo usuario
  Como visitante del sistema
  Quiero registrarme con mis datos personales
  Para poder crear y gestionar CDTs

  Background:
    Given que estoy en la página de registro
    And el sistema está disponible

  Scenario: Registro exitoso con datos válidos
    Given que no tengo una cuenta en el sistema
    When ingreso los siguientes datos:
      | campo              | valor                    |
      | tipo_documento     | CC                       |
      | numero_documento   | 1234567890               |
      | nombre             | Juan Pérez               |
      | email              | juan.perez@example.com   |
      | telefono           | 3001234567               |
      | contraseña         | Password123!             |
      | confirmar_contraseña | Password123!           |
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje "Usuario registrado exitosamente"
    And debería ser redirigido a la página de login
    And el sistema debería guardar mis datos con contraseña hasheada
    And mi rol debería ser "user" por defecto

  Scenario: Intento de registro con email duplicado
    Given que existe un usuario con email "juan.perez@example.com"
    When ingreso ese mismo email
    And completo los demás campos con datos válidos
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje de error "El email ya está registrado"
    And no debería ser creado un nuevo usuario

  Scenario: Intento de registro con documento duplicado
    Given que existe un usuario con documento CC 1234567890
    When ingreso ese mismo número de documento
    And completo los demás campos con datos válidos
    And hago clic en "Registrar"
    Then debería ver el mensaje "El número de documento ya está registrado"
    And no debería ser creado un nuevo usuario

  Scenario: Intento de registro con contraseñas que no coinciden
    When ingreso los siguientes datos:
      | contraseña         | Password123!  |
      | confirmar_contraseña | Password456! |
    And completo los demás campos correctamente
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje de error "Las contraseñas no coinciden"
    And no debería ser creado un nuevo usuario

  Scenario: Validación de contraseña segura
    When ingreso una contraseña débil "<contraseña>"
    And completo los demás campos correctamente
    And hago clic en "Registrar"
    Then debería ver un mensaje de error de validación

    Examples:
      | contraseña  |
      | 12345678    |
      | password    |
      | Password1   |
      | Pass1!      |

  Scenario: Registro con diferentes tipos de documento
    When selecciono el tipo de documento "<tipo>"
    And ingreso un número de documento válido
    And completo los demás campos correctamente
    And hago clic en "Registrar"
    Then el usuario debería ser creado exitosamente

    Examples:
      | tipo       |
      | CC         |
      | CE         |
      | Pasaporte  |

  Scenario: Rate limiting en registro
    Given que he intentado registrarme 5 veces en 15 minutos
    When intento registrarme por sexta vez
    Then debería ver el mensaje "Demasiadas solicitudes"
    And debería recibir un código de estado 429
```

---

## HU-07: Cerrar Sesión

**Como** usuario autenticado  
**Quiero** cerrar sesión de forma segura  
**Para** proteger mi información personal

**Prioridad:** Media  
**Endpoints:** `POST /api/v1/auth/logout`  
**Archivos:** `authRoutes.js`, `authController.js`, `HeaderFixed.jsx`

### Criterios de Aceptación

```gherkin
Feature: Cerrar sesión
  Como usuario autenticado
  Quiero cerrar sesión de forma segura
  Para proteger mi información

  Background:
    Given que estoy autenticado en el sistema
    And estoy en el dashboard

  Scenario: Cerrar sesión exitosamente
    When hago clic en el menú de usuario en el header
    And selecciono "Cerrar Sesión"
    Then debería ver el mensaje "Sesión cerrada exitosamente"
    And debería ser redirigido a la página principal
    And mi token JWT debería ser removido del localStorage
    And mis datos de usuario deberían ser removidos del localStorage
    And no debería tener acceso a rutas protegidas

  Scenario: Intentar acceder a rutas protegidas después de cerrar sesión
    Given que he cerrado sesión
    When intento acceder a "/dashboard"
    Then debería ser redirigido a la página principal
    And no debería poder hacer peticiones autenticadas

  Scenario: Limpieza completa del localStorage
    Given que tengo datos en localStorage
    When cierro sesión
    Then localStorage.getItem('token') debería retornar null
    And localStorage.getItem('currentUser') debería retornar null
```

---

## 💰 MÓDULO: GESTIÓN DE CDTs (USUARIO)

---

## HU-08: Simulador de CDT

**Como** visitante o usuario autenticado  
**Quiero** simular una inversión CDT con monto y plazo  
**Para** conocer el retorno estimado antes de crear el CDT

**Prioridad:** Alta  
**Endpoints:** Ninguno (cálculo en frontend)  
**Archivos:** `CDTSimulator.jsx`, `financialRules.js`

### Criterios de Aceptación

```gherkin
Feature: Simulador de CDT
  Como visitante del sistema
  Quiero simular una inversión en CDT
  Para conocer el retorno estimado antes de invertir

  Background:
    Given que estoy en la página del simulador
    And el simulador está disponible sin requerir autenticación

  Scenario: Simulación exitosa con parámetros válidos
    When ingreso los siguientes datos:
      | monto       | 10000000     |
      | plazo_meses | 12           |
    And hago clic en "Calcular"
    Then debería ver los resultados:
      | campo             | valor         |
      | monto_invertido   | $10,000,000   |
      | plazo             | 12 meses      |
      | plazo_dias        | 360 días      |
      | tasa_interes      | 9.5%          |
      | interes_ganado    | $950,000      |
      | valor_final       | $10,950,000   |

  Scenario: Cálculo de tasa de interés según plazo
    When simulo con los siguientes plazos:
      | plazo_meses | tasa_esperada |
      | 1           | 7.5%          |
      | 2           | 8.0%          |
      | 3           | 8.5%          |
      | 6           | 9.0%          |
      | 12          | 9.5%          |
    Then cada simulación debería mostrar la tasa correcta

  Scenario: Validación de monto mínimo
    When ingreso un monto de $400,000
    And hago clic en "Calcular"
    Then debería ver el mensaje de error "El monto mínimo es $500,000"
    And no debería mostrar resultados

  Scenario: Validación de monto máximo
    When ingreso un monto de $600,000,000
    And hago clic en "Calcular"
    Then debería ver el mensaje de error "El monto máximo es $500,000,000"

  Scenario: Crear CDT desde simulación (usuario autenticado)
    Given que estoy autenticado
    And he realizado una simulación exitosa
    When hago clic en "Crear este CDT"
    Then debería ser redirigido al formulario de creación
    And el formulario debería estar pre-llenado con los datos

  Scenario: Botón "Crear CDT" oculto para visitantes
    Given que NO estoy autenticado
    And he realizado una simulación exitosa
    Then no debería ver el botón "Crear este CDT"
    And debería ver un mensaje "Inicia sesión para crear este CDT"
```

---

## HU-03: Crear Solicitud de CDT

**Como** cliente bancario  
**Quiero** crear una nueva Solicitud de CDT en estado borrador  
**Para** poder completarla y enviarla a validación

**Prioridad:** Alta  
**Endpoints:** `POST /api/v1/cdts/`  
**Archivos:** `cdtRoutes.js`, `cdtController.js`, `CreateCDT.jsx`

### Criterios de Aceptación

```gherkin
Feature: Crear solicitud de CDT
  Como usuario autenticado
  Quiero crear un nuevo CDT en estado borrador
  Para invertir mi dinero

  Background:
    Given que estoy autenticado en el sistema
    And estoy en la página de creación de CDT

  Scenario: Crear CDT exitosamente en estado borrador
    When ingreso los siguientes datos:
      | campo              | valor            |
      | amount             | 10000000         |
      | termMonths         | 12               |
      | renovationOption   | capital          |
    And hago clic en "Crear CDT"
    Then debería ver el mensaje "CDT creado exitosamente"
    And el CDT debería tener estado "draft"
    And debería ser redirigido a los detalles del CDT

  Scenario: Cálculo automático de tasa según plazo
    When creo CDTs con diferentes plazos:
      | termMonths | expected_rate |
      | 1          | 7.5           |
      | 2          | 8.0           |
      | 3          | 8.5           |
      | 6          | 9.0           |
      | 12         | 9.5           |
    Then cada CDT debería tener la tasa correcta asignada

  Scenario: Crear CDT con diferentes opciones de renovación
    When creo un CDT con renovationOption "<opcion>"
    And hago clic en "Crear CDT"
    Then el CDT debería crearse exitosamente

    Examples:
      | opcion           |
      | capital          |
      | capital_interest |
      | none             |

  Scenario: Validación de monto mínimo
    When ingreso un monto de $400,000
    And hago clic en "Crear CDT"
    Then debería ver el mensaje "El monto debe estar entre $500,000 y $500,000,000"
    And el CDT no debería ser creado

  Scenario: Asociación automática del CDT al usuario
    Given que estoy autenticado como usuario con ID 123
    When creo un CDT exitosamente
    Then el campo userId del CDT debería ser 123
    And solo yo debería poder ver este CDT
```

---

## HU-09: Editar CDT en Borrador

**Como** cliente bancario  
**Quiero** editar mi CDT en estado borrador  
**Para** corregir datos antes de enviarlo a validación

**Prioridad:** Media  
**Endpoints:** `PATCH /api/v1/cdts/:id`  
**Archivos:** `cdtRoutes.js`, `cdtService.js`, `CDTDetails.jsx`

### Criterios de Aceptación

```gherkin
Feature: Editar CDT en borrador
  Como usuario autenticado
  Quiero editar mi CDT en estado draft
  Para corregir información antes de enviarlo

  Background:
    Given que estoy autenticado
    And tengo un CDT con estado "draft"
    And estoy en la página de detalles del CDT

  Scenario: Activar modo de edición en CDT draft
    When hago clic en el botón "Editar"
    Then los campos deberían volverse editables
    And debería ver botones "Guardar" y "Cancelar"

  Scenario: Editar monto exitosamente
    Given que estoy en modo edición
    When cambio el monto de $10,000,000 a $15,000,000
    And hago clic en "Guardar"
    Then debería ver el mensaje "CDT actualizado exitosamente"
    And el nuevo monto debería mostrarse
    And el expectedReturn debería recalcularse

  Scenario: Editar plazo y recalcular automáticamente
    Given que estoy en modo edición
    When cambio el plazo de 12 meses a 6 meses
    And hago clic en "Guardar"
    Then el sistema debería recalcular termDays e interestRate

  Scenario: Cancelar edición sin guardar cambios
    Given que estoy en modo edición
    And he modificado el monto
    When hago clic en "Cancelar"
    Then el monto debería volver a su valor original
    And no debería guardarse ningún cambio

  Scenario: No permitir edición si estado no es draft
    Given que tengo un CDT con estado "<estado>"
    When accedo a los detalles del CDT
    Then no debería ver el botón "Editar"

    Examples:
      | estado    |
      | pending   |
      | active    |
      | cancelled |
```

---

## HU-04: Enviar a Validación

**Como** cliente bancario  
**Quiero** enviar mi solicitud de CDT a estado "en validación"  
**Para** que sea evaluada por un administrador

**Prioridad:** Alta  
**Endpoints:** `POST /api/v1/cdts/:id/submit`  
**Archivos:** `cdtRoutes.js`, `cdtController.js`, `CDTDetails.jsx`

### Criterios de Aceptación

```gherkin
Feature: Enviar CDT a validación
  Como usuario autenticado
  Quiero enviar mi CDT borrador a revisión
  Para que sea aprobado por un administrador

  Background:
    Given que estoy autenticado
    And tengo un CDT con estado "draft"

  Scenario: Enviar CDT a revisión exitosamente
    When accedo a los detalles del CDT
    And hago clic en "Enviar a Revisión"
    And confirmo la acción en el modal
    Then debería ver el mensaje "CDT enviado a revisión exitosamente"
    And el estado del CDT debería cambiar a "pending"
    And no debería poder editar el CDT

  Scenario: Confirmar envío a revisión con modal
    When hago clic en "Enviar a Revisión"
    Then debería ver un modal de confirmación
    And el modal debería tener botones "Cancelar" y "Confirmar"

  Scenario: Cancelar envío a revisión
    When hago clic en "Enviar a Revisión"
    And hago clic en "Cancelar" en el modal
    Then el modal debería cerrarse
    And el CDT debería seguir en estado "draft"

  Scenario: Invalidación de caché al enviar
    When envío el CDT a revisión exitosamente
    Then el sistema debería invalidar todos los cachés relevantes
```

---

## HU-05: Listar y Filtrar CDTs

**Como** cliente bancario  
**Quiero** ver un listado de mis solicitudes con filtros  
**Para** ubicar rápidamente su estado y avance

**Prioridad:** Alta  
**Endpoints:** `GET /api/v1/cdts/my-cdts`  
**Archivos:** `cdtRoutes.js`, `Dashboard.jsx`

### Criterios de Aceptación

```gherkin
Feature: Listar y filtrar mis CDTs
  Como usuario autenticado
  Quiero ver la lista de todos mis CDT
  Para gestionar mis inversiones

  Background:
    Given que estoy autenticado
    And tengo CDTs en diferentes estados

  Scenario: Ver lista completa de mis CDT
    When accedo a la página "Dashboard"
    Then debería ver una lista con todos mis CDTs
    And cada CDT debería mostrar ID, monto, plazo y estado

  Scenario: Filtrar CDT por estado
    When filtro por estado "<estado>"
    Then debería ver solo CDTs con ese estado

    Examples:
      | estado    |
      | draft     |
      | pending   |
      | active    |
      | cancelled |

  Scenario: Ver CDT sin inversiones
    Given que no tengo CDT creados
    When accedo a la página "Dashboard"
    Then debería ver el mensaje "No tienes CDTs creados"

  Scenario: Acceder a detalles desde la lista
    When hago clic en un CDT
    Then debería ser redirigido a la página de detalles

  Scenario: Cálculo de total invertido
    When accedo al dashboard
    Then debería ver el total invertido
    And solo debería contar CDTs activos
```

---

## HU-06: Ver Detalle y Bitácora

**Como** cliente bancario  
**Quiero** ver el detalle de una solicitud y su historial  
**Para** entender qué ocurrió y cuándo

**Prioridad:** Media  
**Endpoints:** `GET /api/v1/cdts/:id`, `GET /api/v1/cdts/:id/audit`  
**Archivos:** `cdtController.js`, `CDTDetails.jsx`

### Criterios de Aceptación

```gherkin
Feature: Ver detalles de CDT y bitácora
  Como usuario autenticado
  Quiero ver los detalles completos de un CDT
  Para revisar mi inversión

  Background:
    Given que estoy autenticado
    And tengo un CDT creado

  Scenario: Ver todos los detalles del CDT
    When accedo a los detalles del CDT
    Then debería ver toda la información del CDT
    And debería ver un badge de color según el estado

  Scenario: Ver historial de auditoría
    Given que el CDT ha tenido cambios
    When accedo a la sección "Historial"
    Then debería ver todos los eventos en orden cronológico

  Scenario: Acciones disponibles según estado
    When el CDT está en estado "<estado>"
    Then las acciones disponibles deberían corresponder

    Examples:
      | estado    |
      | draft     |
      | pending   |
      | active    |
```

---

## HU-10: Cancelar CDT

**Como** cliente bancario  
**Quiero** cancelar un CDT activo o pendiente  
**Para** recuperar mi inversión o detener la solicitud

**Prioridad:** Media  
**Endpoints:** `POST /api/v1/cdts/:id/cancel`  
**Archivos:** `cdtRoutes.js`, `CDTDetails.jsx`

### Criterios de Aceptación

```gherkin
Feature: Cancelar CDT
  Como usuario autenticado
  Quiero cancelar un CDT
  Para recuperar mi inversión

  Background:
    Given que estoy autenticado
    And tengo un CDT con estado "active" o "pending"

  Scenario: Cancelar CDT exitosamente con razón
    When accedo a los detalles del CDT
    And hago clic en "Cancelar CDT"
    And ingreso una razón de cancelación
    And confirmo la cancelación
    Then debería ver el mensaje "CDT cancelado exitosamente"
    And el estado del CDT debería cambiar a "cancelled"

  Scenario: Validar razón de cancelación obligatoria
    When intento cancelar el CDT sin ingresar razón
    Then debería ver el mensaje "Debe ingresar una razón"
    And el CDT no debería ser cancelado

  Scenario: No permitir cancelación de CDT cancelado
    Given que el CDT está en estado "cancelled"
    When accedo a los detalles
    Then no debería ver el botón "Cancelar CDT"

  Scenario: Invalidación de caché al cancelar
    When cancelo el CDT exitosamente
    Then el sistema debería invalidar todos los cachés
```

---

## 👨‍💼 MÓDULO: ADMINISTRACIÓN

---

## HU-13: Dashboard Admin

**Como** administrador  
**Quiero** ver estadísticas generales y CDTs pendientes  
**Para** gestionar eficientemente las solicitudes

**Prioridad:** Alta  
**Endpoints:** `GET /api/v1/cdts/admin/stats`, `GET /api/v1/cdts/admin/pending`  
**Archivos:** `cdtController.js`, `AdminPanel.jsx`

### Criterios de Aceptación

```gherkin
Feature: Dashboard de administración
  Como administrador
  Quiero ver estadísticas y CDTs pendientes
  Para gestionar solicitudes eficientemente

  Background:
    Given que estoy autenticado como administrador

  Scenario: Ver estadísticas generales del sistema
    When accedo al dashboard admin
    Then debería ver estadísticas de todos los CDTs
    And debería ver total por cada estado

  Scenario: Ver lista de CDTs pendientes
    Given que hay CDTs en estado "pending"
    When accedo a la sección "CDT Pendientes"
    Then debería ver la lista de CDTs pendientes
    And cada CDT debería tener acciones de aprobar/rechazar

  Scenario: Filtrar CDTs por estado
    When selecciono un filtro de estado
    Then solo debería ver CDTs con ese estado

  Scenario: Validar permisos de administrador
    Given que estoy autenticado como usuario regular
    When intento acceder a "/admin"
    Then debería ver mensaje "No tiene permisos"
```

---

## HU-11: Aprobar CDT (Admin)

**Como** administrador  
**Quiero** aprobar CDT pendientes  
**Para** activarlos y que generen rentabilidad

**Prioridad:** Alta  
**Endpoints:** `POST /api/v1/cdts/:id/approve`  
**Archivos:** `cdtController.js`, `AdminPanel.jsx`

### Criterios de Aceptación

```gherkin
Feature: Aprobar CDT (Admin)
  Como administrador
  Quiero aprobar CDT pendientes
  Para activarlos

  Background:
    Given que estoy autenticado como administrador
    And hay CDTs en estado "pending"

  Scenario: Aprobar CDT exitosamente
    When hago clic en "Aprobar" en un CDT
    And confirmo la aprobación
    Then debería ver el mensaje "CDT aprobado exitosamente"
    And el estado del CDT debería cambiar a "active"

  Scenario: Aprobar CDT con notas administrativas
    When apruebo un CDT con notas
    Then las notas deberían guardarse en el historial

  Scenario: Actualizar fechas al aprobar
    When apruebo un CDT
    Then debería establecerse startDate y maturityDate

  Scenario: Invalidación de caché al aprobar
    When apruebo un CDT exitosamente
    Then el sistema debería invalidar todos los cachés relevantes
```

---

## HU-12: Rechazar CDT (Admin)

**Como** administrador  
**Quiero** rechazar CDT pendientes con razón  
**Para** devolver solicitudes que no cumplen requisitos

**Prioridad:** Alta  
**Endpoints:** `POST /api/v1/cdts/:id/reject`  
**Archivos:** `cdtController.js`, `AdminPanel.jsx`

### Criterios de Aceptación

```gherkin
Feature: Rechazar CDT (Admin)
  Como administrador
  Quiero rechazar CDT pendientes
  Para devolver solicitudes no válidas

  Background:
    Given que estoy autenticado como administrador
    And hay un CDT pendiente

  Scenario: Rechazar CDT con razón obligatoria
    When hago clic en "Rechazar"
    And ingreso una razón de rechazo
    And confirmo el rechazo
    Then debería ver el mensaje "CDT rechazado exitosamente"
    And el estado debería cambiar a "rejected"
    And la razón debería ser visible para el usuario

  Scenario: Validar razón de rechazo obligatoria
    When intento rechazar sin ingresar razón
    Then debería ver mensaje de error
    And el CDT no debería ser rechazado

  Scenario: Usuario puede ver CDT rechazado
    Given que un CDT fue rechazado
    When el usuario accede a sus detalles
    Then debería ver el estado "Rechazado"
    And debería ver la razón de rechazo
```

---

## 📊 MÓDULO: REPORTES

---

## HU-14: Ver Estado de Cuenta

**Como** usuario autenticado  
**Quiero** ver mi estado de cuenta con resumen de inversiones  
**Para** revisar mi portafolio de CDTs

**Prioridad:** Media  
**Endpoints:** `GET /api/v1/cdts/my-cdts`  
**Archivos:** `Dashboard.jsx`, `AccountStatement.jsx`

### Criterios de Aceptación

```gherkin
Feature: Ver estado de cuenta
  Como usuario autenticado
  Quiero ver mi estado de cuenta
  Para revisar mis inversiones

  Background:
    Given que estoy autenticado
    And tengo CDTs creados

  Scenario: Ver resumen general
    When accedo al dashboard
    Then debería ver un resumen con:
      | Total invertido (activos)   |
      | Cantidad de CDTs por estado |
      | Total intereses esperados   |

  Scenario: Ver lista de todos mis CDTs
    When accedo al dashboard
    Then debería ver una lista con todos mis CDT

  Scenario: Cálculo de total invertido solo con CDTs activos
    When el sistema calcula el total invertido
    Then solo debería sumar CDTs con estado "active"

  Scenario: Actualización en tiempo real
    When realizo acciones sobre CDTs
    Then el estado de cuenta debería actualizarse automáticamente

  Scenario: Estados vacíos con mensaje amigable
    Given que no tengo CDTs creados
    When accedo al dashboard
    Then debería ver mensaje "No tienes CDTs creados"
    And debería ver botón para crear CDT
```

---

## 📊 Resumen de Historias de Usuario

| ID | Historia | Módulo | Prioridad | Estado |
|----|----------|--------|-----------|--------|
| HU-01 | Login del Cliente | Autenticación | Alta | ✅ Implementada |
| HU-02 | Registro de Usuario | Autenticación | Alta | ✅ Implementada |
| HU-07 | Cerrar Sesión | Autenticación | Media | ✅ Implementada |
| HU-08 | Simulador de CDT | Gestión CDTs | Alta | ✅ Implementada |
| HU-03 | Crear Solicitud de CDT | Gestión CDTs | Alta | ✅ Implementada |
| HU-09 | Editar CDT en Borrador | Gestión CDTs | Media | ✅ Implementada |
| HU-04 | Enviar a Validación | Gestión CDTs | Alta | ✅ Implementada |
| HU-05 | Listar y Filtrar CDTs | Gestión CDTs | Alta | ✅ Implementada |
| HU-06 | Ver Detalle y Bitácora | Gestión CDTs | Media | ✅ Implementada |
| HU-10 | Cancelar CDT | Gestión CDTs | Media | ✅ Implementada |
| HU-13 | Dashboard Admin | Administración | Alta | ✅ Implementada |
| HU-11 | Aprobar CDT (Admin) | Administración | Alta | ✅ Implementada |
| HU-12 | Rechazar CDT (Admin) | Administración | Alta | ✅ Implementada |
| HU-14 | Ver Estado de Cuenta | Reportes | Media | ✅ Implementada |

**Total:** 14 Historias de Usuario  
**Escenarios:** 70+ casos de prueba en formato Gherkin  
**Cobertura:** 4 módulos completos

---

## 📝 Notas Técnicas

### Estados del CDT
- **draft:** Borrador, editable por el usuario
- **pending:** En revisión, esperando aprobación
- **active:** Aprobado y activo
- **cancelled:** Cancelado
- **rejected:** Rechazado por admin
- **completed:** Vencido

### Tasas de Interés
- 1 mes: 7.5%
- 2 meses: 8.0%
- 3 meses: 8.5%
- 6 meses: 9.0%
- 12 meses: 9.5%

### Validaciones
- **Monto:** $500,000 - $500,000,000
- **Plazo:** 1 - 12 meses
- **Contraseña:** Min 8 caracteres, mayúscula, número, símbolo

---

**Nota:** Formato Gherkin compatible con Cucumber, SpecFlow y Behave.
