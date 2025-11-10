# Historias de Usuario con Criterios de Aceptación Gherkin - NeoCDT

**Proyecto:** Sistema de CDT
**Fecha:** 17 de octubre de 2025  
**Materia:** Ingeniería de Software

---

## 📋 Índice de Historias de Usuario

1. [HU-01: Registro de Usuario](#hu-01-registro-de-usuario)
2. [HU-02: Inicio de Sesión](#hu-02-inicio-de-sesión)
3. [HU-03: Cerrar Sesión](#hu-03-cerrar-sesión)
4. [HU-04: Simulador de CDT](#hu-04-simulador-de-cdt)
5. [HU-05: Crear CDT](#hu-05-crear-cdt)
6. [HU-06: Listar Mis CDT](#hu-06-listar-mis-cdt)
7. [HU-07: Ver Detalles de CDT](#hu-07-ver-detalles-de-cdt)
8. [HU-08: Enviar CDT a Revisión](#hu-08-enviar-cdt-a-revisión)
9. [HU-09: Cancelar CDT](#hu-09-cancelar-cdt)
10. [HU-10: Aprobar CDT (Admin)](#hu-10-aprobar-cdt-admin)
11. [HU-11: Rechazar CDT (Admin)](#hu-11-rechazar-cdt-admin)
12. [HU-12: Ver Estado de Cuenta](#hu-12-ver-estado-de-cuenta)

---

## HU-01: Registro de Usuario

**Como** visitante del sistema  
**Quiero** registrarme con mis datos personales  
**Para** poder acceder a las funcionalidades del sistema de CDT

### Criterios de Aceptación

```gherkin
Feature: Registro de nuevo usuario
  Como visitante del sistema
  Quiero registrarme con mis datos personales
  Para poder crear y gestionar CDT

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
    And debería recibir un email de confirmación

  Scenario: Intento de registro con email duplicado
    Given que existe un usuario con email "juan.perez@example.com"
    When ingreso los siguientes datos:
      | campo              | valor                    |
      | tipo_documento     | CC                       |
      | numero_documento   | 9876543210               |
      | nombre             | Pedro García             |
      | email              | juan.perez@example.com   |
      | telefono           | 3009876543               |
      | contraseña         | Password123!             |
      | confirmar_contraseña | Password123!           |
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje de error "El email ya está registrado"
    And no debería ser creado un nuevo usuario

  Scenario: Intento de registro con contraseñas que no coinciden
    Given que no tengo una cuenta en el sistema
    When ingreso los siguientes datos:
      | campo              | valor                    |
      | tipo_documento     | CC                       |
      | numero_documento   | 1234567890               |
      | nombre             | Juan Pérez               |
      | email              | juan.perez@example.com   |
      | telefono           | 3001234567               |
      | contraseña         | Password123!             |
      | confirmar_contraseña | Password456!           |
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje de error "Las contraseñas no coinciden"
    And no debería ser creado un nuevo usuario

  Scenario: Intento de registro con email inválido
    Given que no tengo una cuenta en el sistema
    When ingreso los siguientes datos:
      | campo              | valor                    |
      | tipo_documento     | CC                       |
      | numero_documento   | 1234567890               |
      | nombre             | Juan Pérez               |
      | email              | email_invalido           |
      | telefono           | 3001234567               |
      | contraseña         | Password123!             |
      | confirmar_contraseña | Password123!           |
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje de error "Formato de email inválido"
    And no debería ser creado un nuevo usuario

  Scenario: Registro de usuario extranjero
    Given que no tengo una cuenta en el sistema
    And soy un usuario extranjero
    When ingreso los siguientes datos:
      | campo              | valor                    |
      | tipo_documento     | CE                       |
      | numero_documento   | 1234567890               |
      | nombre             | María González           |
      | email              | maria@example.com        |
      | telefono           | 3001234567               |
      | nacionalidad       | Venezuela                |
      | fecha_residencia   | 2023-01-15               |
      | contraseña         | Password123!             |
      | confirmar_contraseña | Password123!           |
    And hago clic en el botón "Registrar"
    Then debería ver el mensaje "Usuario registrado exitosamente"
    And el sistema debería guardar mi nacionalidad
    And el sistema debería guardar mi fecha de residencia
```

---

## HU-02: Inicio de Sesión

**Como** usuario registrado  
**Quiero** iniciar sesión con mis credenciales  
**Para** acceder a mi cuenta y gestionar mis CDT

### Criterios de Aceptación

```gherkin
Feature: Inicio de sesión
  Como usuario registrado
  Quiero iniciar sesión con mis credenciales
  Para acceder a las funcionalidades del sistema

  Background:
    Given que estoy en la página de login
    And existe un usuario con las siguientes credenciales:
      | tipo_documento   | CC              |
      | numero_documento | 1234567890      |
      | contraseña       | Password123!    |

  Scenario: Login exitoso con credenciales válidas
    When ingreso las siguientes credenciales:
      | tipo_documento   | CC           |
      | numero_documento | 1234567890   |
      | contraseña       | Password123! |
    And hago clic en el botón "Iniciar Sesión"
    Then debería ser redirigido al dashboard
    And debería ver mi nombre en el header
    And debería tener un token de sesión válido
    And debería tener acceso a las rutas protegidas

  Scenario: Intento de login con contraseña incorrecta
    When ingreso las siguientes credenciales:
      | tipo_documento   | CC              |
      | numero_documento | 1234567890      |
      | contraseña       | WrongPassword!  |
    And hago clic en el botón "Iniciar Sesión"
    Then debería ver el mensaje de error "Credenciales inválidas"
    And no debería ser autenticado
    And no debería tener un token de sesión

  Scenario: Intento de login con usuario inexistente
    When ingreso las siguientes credenciales:
      | tipo_documento   | CC           |
      | numero_documento | 9999999999   |
      | contraseña       | Password123! |
    And hago clic en el botón "Iniciar Sesión"
    Then debería ver el mensaje de error "Credenciales inválidas"
    And no debería ser autenticado

  Scenario: Intento de login sin completar campos requeridos
    When dejo los campos vacíos
    And hago clic en el botón "Iniciar Sesión"
    Then debería ver mensajes de validación:
      | campo            | mensaje                           |
      | tipo_documento   | El tipo de documento es requerido |
      | numero_documento | El número de documento es requerido |
      | contraseña       | La contraseña es requerida        |
    And no debería ser enviada la petición al servidor

  Scenario: Persistencia de sesión después de recargar página
    Given que he iniciado sesión exitosamente
    When recargo la página
    Then debería seguir autenticado
    And debería ver mi información en el dashboard
    And no debería ser redirigido al login
```

---

## HU-03: Cerrar Sesión

**Como** usuario autenticado  
**Quiero** cerrar sesión de forma segura  
**Para** proteger mi información personal

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
    When hago clic en el botón "Cerrar Sesión"
    Then debería ser redirigido a la página principal
    And mi token de sesión debería ser invalidado
    And no debería tener acceso a rutas protegidas
    And el localStorage debería estar limpio
    And debería ver el mensaje "Sesión cerrada exitosamente"

  Scenario: Intentar acceder a rutas protegidas después de cerrar sesión
    Given que he cerrado sesión
    When intento acceder a "/dashboard"
    Then debería ser redirigido a la página de login
    And debería ver el mensaje "Debe iniciar sesión para acceder"

  Scenario: Cerrar sesión con múltiples pestañas abiertas
    Given que tengo 3 pestañas del sistema abiertas
    When cierro sesión en la pestaña 1
    Then todas las pestañas deberían cerrar sesión
    And todas las pestañas deberían redirigir al login
```

---

## HU-04: Simulador de CDT

**Como** visitante o usuario autenticado  
**Quiero** simular una inversión en CDT  
**Para** conocer el retorno estimado antes de crear un CDT

### Criterios de Aceptación

```gherkin
Feature: Simulador de CDT
  Como visitante del sistema
  Quiero simular una inversión en CDT
  Para conocer el retorno estimado antes de invertir

  Background:
    Given que estoy en la página del simulador
    And el simulador está disponible

  Scenario: Simulación exitosa con parámetros válidos
    When ingreso los siguientes datos:
      | monto  | 10000000  |
      | plazo  | 360 días  |
    And hago clic en "Calcular"
    Then debería ver los resultados:
      | campo             | valor         |
      | monto_invertido   | $10,000,000   |
      | plazo             | 360 días      |
      | tasa_interes      | 9.5%          |
      | interes_ganado    | $950,000      |
      | valor_final       | $10,950,000   |
    And debería ver un desglose mensual del retorno
    And debería ver la fecha de vencimiento estimada

  Scenario: Simulación con diferentes plazos y tasas
    When simulo con los siguientes parámetros:
      | monto     | plazo      | tasa_esperada |
      | 5000000   | 90 días    | 8.5%          |
      | 10000000  | 180 días   | 9.5%          |
      | 20000000  | 270 días   | 10.5%         |
      | 30000000  | 360 días   | 11.5%         |
    Then cada simulación debería mostrar la tasa correcta
    And cada simulación debería calcular el retorno correcto

  Scenario: Validación de monto mínimo
    When ingreso un monto de $400,000
    And hago clic en "Calcular"
    Then debería ver el mensaje de error "El monto mínimo es $500,000"
    And no debería mostrar resultados

  Scenario: Validación de monto máximo
    When ingreso un monto de $600,000,000
    And hago clic en "Calcular"
    Then debería ver el mensaje de error "El monto máximo es $500,000,000"
    And no debería mostrar resultados

  Scenario: Validación de plazo mínimo
    When ingreso un plazo de 20 días
    And hago clic en "Calcular"
    Then debería ver el mensaje de error "El plazo mínimo es 30 días"
    And no debería mostrar resultados

  Scenario: Validación de plazo máximo
    When ingreso un plazo de 400 días
    And hago clic en "Calcular"
    Then debería ver el mensaje de error "El plazo máximo es 360 días"
    And no debería mostrar resultados

  Scenario: Crear CDT desde simulación (usuario autenticado)
    Given que estoy autenticado
    And he realizado una simulación exitosa
    When hago clic en "Crear este CDT"
    Then debería ser redirigido al formulario de creación de CDT
    And el formulario debería estar pre-llenado con los datos de la simulación
```

---

## HU-05: Crear CDT

**Como** usuario autenticado  
**Quiero** crear un nuevo CDT  
**Para** invertir mi dinero y obtener rentabilidad

### Criterios de Aceptación

```gherkin
Feature: Crear CDT
  Como usuario autenticado
  Quiero crear un nuevo CDT
  Para invertir mi dinero

  Background:
    Given que estoy autenticado en el sistema
    And estoy en la página de creación de CDT

  Scenario: Crear CDT exitosamente
    When ingreso los siguientes datos:
      | monto              | 10000000         |
      | plazo              | 360 días         |
      | fecha_inicio       | 2025-10-20       |
      | opcion_renovacion  | capital          |
    And hago clic en "Crear CDT"
    Then debería ver el mensaje "CDT creado exitosamente"
    And el CDT debería tener estado "draft"
    And debería ser redirigido a los detalles del CDT
    And debería ver todos los datos del CDT creado

  Scenario: Crear CDT con renovación automática de capital e intereses
    When ingreso los siguientes datos:
      | monto              | 15000000              |
      | plazo              | 720 días              |
      | fecha_inicio       | 2025-11-01            |
      | opcion_renovacion  | capital_interest      |
    And hago clic en "Crear CDT"
    Then el CDT debería ser creado exitosamente
    And la opción de renovación debería ser "capital_interest"
    And al vencimiento debería renovarse con capital + intereses

  Scenario: Validación de monto fuera de rango
    When ingreso un monto de $400,000
    And hago clic en "Crear CDT"
    Then debería ver el mensaje "El monto debe estar entre $500,000 y $500,000,000"
    And el CDT no debería ser creado

  Scenario: Validación de plazo fuera de rango
    When ingreso un plazo de 20 días
    And hago clic en "Crear CDT"
    Then debería ver el mensaje "El plazo debe estar entre 30 y 360 días"
    And el CDT no debería ser creado

  Scenario: Validación de fecha de inicio inválida
    When ingreso una fecha de inicio del pasado
    And hago clic en "Crear CDT"
    Then debería ver el mensaje "La fecha de inicio debe ser futura"
    And el CDT no debería ser creado

  Scenario: Calcular tasa de interés automáticamente según plazo
    When ingreso los siguientes plazos:
      | plazo_dias | tasa_esperada |
      | 180        | 8.5%          |
      | 360        | 9.5%          |
      | 720        | 10.5%         |
      | 1080       | 11.0%         |
      | 1800       | 11.5%         |
    Then el sistema debería asignar automáticamente la tasa correcta
    And debería mostrar la tasa en el preview
```

---

## HU-06: Listar Mis CDT

**Como** usuario autenticado  
**Quiero** ver la lista de todos mis CDT  
**Para** gestionar mis inversiones

### Criterios de Aceptación

```gherkin
Feature: Listar mis CDT
  Como usuario autenticado
  Quiero ver la lista de todos mis CDT
  Para gestionar mis inversiones

  Background:
    Given que estoy autenticado en el sistema
    And tengo los siguientes CDT creados:
      | id   | monto     | plazo   | estado    |
      | CDT1 | 10000000  | 360     | active    |
      | CDT2 | 15000000  | 720     | pending   |
      | CDT3 | 5000000   | 180     | draft     |
      | CDT4 | 20000000  | 1080    | cancelled |

  Scenario: Ver lista completa de mis CDT
    When accedo a la página "Mis CDT"
    Then debería ver una lista con 4 CDT
    And cada CDT debería mostrar:
      | campo              |
      | ID del CDT         |
      | Monto invertido    |
      | Plazo en días      |
      | Tasa de interés    |
      | Fecha de inicio    |
      | Fecha de vencimiento |
      | Estado actual      |
      | Retorno esperado   |

  Scenario: Filtrar CDT por estado "Activos"
    When filtro por estado "active"
    Then debería ver solo 1 CDT
    And el CDT mostrado debería tener estado "active"

  Scenario: Filtrar CDT por estado "Pendientes"
    When filtro por estado "pending"
    Then debería ver solo 1 CDT
    And el CDT mostrado debería tener estado "pending"

  Scenario: Filtrar CDT por estado "Borradores"
    When filtro por estado "draft"
    Then debería ver solo 1 CDT
    And el CDT mostrado debería ser editable

  Scenario: Ordenar CDT por monto descendente
    When ordeno por "monto" en orden "descendente"
    Then los CDT deberían aparecer en este orden:
      | id   | monto     |
      | CDT4 | 20000000  |
      | CDT2 | 15000000  |
      | CDT1 | 10000000  |
      | CDT3 | 5000000   |

  Scenario: Ver CDT sin inversiones
    Given que no tengo CDT creados
    When accedo a la página "Mis CDT"
    Then debería ver el mensaje "No tienes CDT creados"
    And debería ver un botón "Crear mi primer CDT"
    And al hacer clic debería ir al simulador

  Scenario: Acceder a detalles desde la lista
    When hago clic en el CDT con ID "CDT1"
    Then debería ser redirigido a la página de detalles
    And debería ver toda la información del CDT
```

---

## HU-07: Ver Detalles de CDT

**Como** usuario autenticado  
**Quiero** ver los detalles completos de un CDT  
**Para** revisar la información de mi inversión

### Criterios de Aceptación

```gherkin
Feature: Ver detalles de CDT
  Como usuario autenticado
  Quiero ver los detalles completos de un CDT
  Para revisar mi inversión

  Background:
    Given que estoy autenticado
    And tengo un CDT con ID "CDT123" con los siguientes datos:
      | monto              | 10000000    |
      | plazo              | 360 días    |
      | tasa_interes       | 9.5%        |
      | estado             | active      |
      | fecha_inicio       | 2025-10-20  |
      | fecha_vencimiento  | 2026-10-20  |
      | retorno_esperado   | 950000      |

  Scenario: Ver todos los detalles del CDT
    When accedo a los detalles del CDT "CDT123"
    Then debería ver la siguiente información:
      | campo                  | valor           |
      | ID del CDT             | CDT123          |
      | Monto invertido        | $10,000,000     |
      | Plazo                  | 360 días (12 meses) |
      | Tasa de interés        | 9.5% anual      |
      | Estado                 | Activo          |
      | Fecha de inicio        | 20/10/2025      |
      | Fecha de vencimiento   | 20/10/2026      |
      | Interés a ganar        | $950,000        |
      | Valor final            | $10,950,000     |
      | Opción de renovación   | Solo capital    |
    And debería ver un badge de color según el estado
    And debería ver un gráfico del crecimiento

  Scenario: Ver cálculos detallados del retorno
    When accedo a la sección "Detalles del Cálculo"
    Then debería ver:
      | concepto                    | valor       |
      | Capital inicial             | $10,000,000 |
      | Tasa anual                  | 9.5%        |
      | Plazo en días               | 360         |
      | Interés diario              | $2,638.89   |
      | Total intereses             | $950,000    |
      | Valor al vencimiento        | $10,950,000 |
    And debería ver la fórmula utilizada

  Scenario: Ver historial de auditoría del CDT
    Given que el CDT ha tenido los siguientes cambios:
      | fecha      | accion           | usuario      |
      | 2025-10-15 | Creado           | Juan Pérez   |
      | 2025-10-16 | Enviado a revisión | Juan Pérez |
      | 2025-10-17 | Aprobado         | Admin        |
    When accedo a la sección "Historial"
    Then debería ver 3 eventos en orden cronológico
    And cada evento debería mostrar fecha, acción y usuario

  Scenario: Acciones disponibles según estado del CDT
    When el CDT está en estado "<estado>"
    Then las acciones disponibles deberían ser "<acciones>"

    Examples:
      | estado    | acciones                              |
      | draft     | Editar, Enviar a revisión, Eliminar  |
      | pending   | Cancelar solicitud                   |
      | active    | Ver detalles, Cancelar CDT           |
      | cancelled | Ver detalles (solo lectura)          |
      | matured   | Ver detalles, Renovar                |

  Scenario: Descargar certificado del CDT activo
    Given que el CDT está en estado "active"
    When hago clic en "Descargar Certificado"
    Then debería descargarse un PDF con:
      | contenido                    |
      | Logo de la entidad           |
      | Datos del titular            |
      | Número de certificado        |
      | Monto y plazo                |
      | Tasa de interés              |
      | Fechas de inicio y vencimiento |
      | Firma digital                |
```

---

## HU-08: Enviar CDT a Revisión

**Como** usuario autenticado  
**Quiero** enviar mi CDT borrador a revisión  
**Para** que sea aprobado y activado

### Criterios de Aceptación

```gherkin
Feature: Enviar CDT a revisión
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
    And debería ver el mensaje "Su CDT está en revisión"

  Scenario: Confirmar envío a revisión con modal
    When hago clic en "Enviar a Revisión"
    Then debería ver un modal de confirmación con:
      | contenido                                    |
      | Título: "Confirmar envío a revisión"         |
      | Mensaje: "¿Está seguro de enviar este CDT?"  |
      | Advertencia: "No podrá editarlo después"     |
      | Botón "Cancelar"                             |
      | Botón "Confirmar"                            |

  Scenario: Cancelar envío a revisión
    When hago clic en "Enviar a Revisión"
    And hago clic en "Cancelar" en el modal
    Then el modal debería cerrarse
    And el CDT debería seguir en estado "draft"
    And debería poder editarlo

  Scenario: Validación antes de enviar a revisión
    Given que mi CDT tiene datos incompletos
    When intento enviarlo a revisión
    Then debería ver mensajes de validación:
      | campo        | mensaje                          |
      | monto        | El monto es requerido            |
      | fecha_inicio | La fecha de inicio es requerida  |
    And el CDT no debería ser enviado

  Scenario: Notificación al administrador
    When envío el CDT a revisión exitosamente
    Then el administrador debería recibir una notificación
    And el CDT debería aparecer en la lista de pendientes del admin
```

---

## HU-09: Cancelar CDT

**Como** usuario autenticado  
**Quiero** cancelar un CDT activo o pendiente  
**Para** recuperar mi inversión anticipadamente

### Criterios de Aceptación

```gherkin
Feature: Cancelar CDT
  Como usuario autenticado
  Quiero cancelar un CDT
  Para recuperar mi inversión

  Background:
    Given que estoy autenticado
    And tengo un CDT con estado "active"

  Scenario: Cancelar CDT exitosamente con razón
    When accedo a los detalles del CDT
    And hago clic en "Cancelar CDT"
    And ingreso la razón "Necesito el dinero para emergencia médica"
    And confirmo la cancelación
    Then debería ver el mensaje "CDT cancelado exitosamente"
    And el estado del CDT debería cambiar a "cancelled"
    And debería ver la razón de cancelación en el historial
    And la fecha de cancelación debería ser registrada

  Scenario: Validar razón de cancelación obligatoria
    When intento cancelar el CDT
    And no ingreso una razón
    And hago clic en "Confirmar Cancelación"
    Then debería ver el mensaje "Debe ingresar una razón de cancelación"
    And el CDT no debería ser cancelado

  Scenario: Cancelar CDT con penalización por cancelación anticipada
    Given que el CDT tiene 30 días de creado
    And el plazo total es 360 días
    When cancelo el CDT
    Then debería ver una advertencia de penalización:
      | concepto              | valor       |
      | Monto invertido       | $10,000,000 |
      | Interés acumulado     | $79,167     |
      | Penalización (10%)    | -$7,917     |
      | Total a recibir       | $10,071,250 |
    And debería confirmar que acepto la penalización

  Scenario: No permitir cancelación de CDT ya cancelado
    Given que el CDT está en estado "cancelled"
    When accedo a los detalles del CDT
    Then no debería ver el botón "Cancelar CDT"
    And debería ver el mensaje "Este CDT ya ha sido cancelado"

  Scenario: No permitir cancelación de CDT vencido
    Given que el CDT está en estado "matured"
    When accedo a los detalles del CDT
    Then no debería ver el botón "Cancelar CDT"
    And debería ver el botón "Cobrar CDT" o "Renovar"

  Scenario: Registrar auditoría de cancelación
    When cancelo el CDT con razón "Emergencia familiar"
    Then el historial de auditoría debería registrar:
      | campo     | valor                    |
      | accion    | Cancelado                |
      | fecha     | 2025-10-17               |
      | usuario   | Juan Pérez               |
      | razon     | Emergencia familiar      |
      | monto_devuelto | $10,071,250         |
```

---

## HU-10: Aprobar CDT (Admin)

**Como** administrador  
**Quiero** aprobar CDT pendientes  
**Para** activarlos y que generen rentabilidad

### Criterios de Aceptación

```gherkin
Feature: Aprobar CDT (Admin)
  Como administrador del sistema
  Quiero aprobar CDT pendientes
  Para activarlos

  Background:
    Given que estoy autenticado como administrador
    And estoy en el panel de administración
    And hay CDT en estado "pending"

  Scenario: Ver lista de CDT pendientes de aprobación
    When accedo a la sección "CDT Pendientes"
    Then debería ver una lista de todos los CDT con estado "pending"
    And cada CDT debería mostrar:
      | campo              |
      | ID del CDT         |
      | Usuario            |
      | Monto              |
      | Plazo              |
      | Fecha de solicitud |
      | Acciones           |

  Scenario: Aprobar CDT exitosamente
    Given que hay un CDT pendiente con ID "CDT123"
    When hago clic en "Aprobar" en el CDT "CDT123"
    And confirmo la aprobación
    Then debería ver el mensaje "CDT aprobado exitosamente"
    And el estado del CDT debería cambiar a "active"
    And el usuario debería recibir una notificación de aprobación
    And el CDT debería desaparecer de la lista de pendientes

  Scenario: Aprobar CDT con notas administrativas
    Given que hay un CDT pendiente con ID "CDT123"
    When hago clic en "Aprobar"
    And ingreso las notas "CDT aprobado - Documentación verificada"
    And confirmo la aprobación
    Then las notas deberían ser guardadas en el historial
    And deberían ser visibles para el administrador
    And el usuario no debería ver las notas internas

  Scenario: Validar permisos de administrador
    Given que estoy autenticado como usuario regular
    When intento acceder a "/admin/solicitudes"
    Then debería ser redirigido al dashboard
    And debería ver el mensaje "No tiene permisos para acceder"

  Scenario: Aprobar múltiples CDT en lote
    Given que hay 5 CDT pendientes seleccionables
    When selecciono 3 CDT
    And hago clic en "Aprobar Seleccionados"
    And confirmo la acción
    Then los 3 CDT deberían cambiar a estado "active"
    And cada usuario debería recibir su notificación
    And debería ver el mensaje "3 CDT aprobados exitosamente"
```

---

## HU-11: Rechazar CDT (Admin)

**Como** administrador  
**Quiero** rechazar CDT pendientes  
**Para** devolver solicitudes que no cumplen requisitos

### Criterios de Aceptación

```gherkin
Feature: Rechazar CDT (Admin)
  Como administrador del sistema
  Quiero rechazar CDT pendientes
  Para devolver solicitudes que no cumplen requisitos

  Background:
    Given que estoy autenticado como administrador
    And hay un CDT pendiente con ID "CDT123"

  Scenario: Rechazar CDT con razón obligatoria
    When hago clic en "Rechazar" en el CDT "CDT123"
    And ingreso la razón "Monto fuera de política institucional"
    And confirmo el rechazo
    Then debería ver el mensaje "CDT rechazado exitosamente"
    And el estado del CDT debería cambiar a "rejected"
    And el usuario debería recibir una notificación con la razón
    And la razón debería ser visible para el usuario

  Scenario: Validar razón de rechazo obligatoria
    When intento rechazar el CDT
    And no ingreso una razón
    And hago clic en "Confirmar Rechazo"
    Then debería ver el mensaje "Debe ingresar una razón de rechazo"
    And el CDT no debería ser rechazado

  Scenario: Rechazar con razones predefinidas
    When hago clic en "Rechazar"
    Then debería ver un select con opciones:
      | razon                                    |
      | Monto fuera de política                  |
      | Documentación incompleta                 |
      | Usuario no cumple requisitos             |
      | Información inconsistente                |
      | Otra (especificar)                       |
    And debería poder seleccionar una opción
    And si selecciono "Otra" debería ingresar texto

  Scenario: Usuario puede ver CDT rechazado
    Given que el CDT "CDT123" fue rechazado
    When el usuario accede a los detalles del CDT
    Then debería ver:
      | campo              | valor                              |
      | Estado             | Rechazado                          |
      | Razón de rechazo   | Monto fuera de política institucional |
      | Fecha de rechazo   | 2025-10-17                         |
      | Rechazado por      | Admin                              |
    And debería poder eliminarlo o editarlo para reenviar

  Scenario: Registrar auditoría de rechazo
    When rechazo el CDT con razón "Documentación incompleta"
    Then el historial debería registrar:
      | campo           | valor                         |
      | accion          | Rechazado                     |
      | fecha           | 2025-10-17                    |
      | admin           | Admin Usuario                 |
      | razon           | Documentación incompleta      |
```

---

## HU-12: Ver Estado de Cuenta

**Como** usuario autenticado  
**Quiero** ver mi estado de cuenta con todos mis CDT  
**Para** revisar el resumen de mis inversiones

### Criterios de Aceptación

```gherkin
Feature: Ver estado de cuenta
  Como usuario autenticado
  Quiero ver mi estado de cuenta
  Para revisar el resumen de mis inversiones

  Background:
    Given que estoy autenticado
    And tengo los siguientes CDT:
      | id   | monto     | estado  | interes_ganado |
      | CDT1 | 10000000  | active  | 237500         |
      | CDT2 | 15000000  | active  | 356250         |
      | CDT3 | 5000000   | matured | 425000         |

  Scenario: Ver resumen general del estado de cuenta
    When accedo a "Estado de Cuenta"
    Then debería ver un resumen con:
      | concepto                    | valor        |
      | Total invertido             | $30,000,000  |
      | CDT activos                 | 2            |
      | CDT vencidos                | 1            |
      | Intereses acumulados        | $593,750     |
      | Intereses cobrados          | $425,000     |
      | Total intereses             | $1,018,750   |
      | Valor total de la cartera   | $31,018,750  |

  Scenario: Ver lista detallada de movimientos
    When accedo a la sección "Movimientos"
    Then debería ver una tabla con todos los CDT
    And cada fila debería mostrar:
      | campo              |
      | Fecha              |
      | Tipo (creación/vencimiento/cancelación) |
      | CDT ID             |
      | Monto              |
      | Estado             |
      | Acción             |
    And debería poder filtrar por fecha
    And debería poder exportar a PDF o Excel

  Scenario: Filtrar estado de cuenta por rango de fechas
    When selecciono rango de fechas:
      | desde | 2025-01-01 |
      | hasta | 2025-12-31 |
    And hago clic en "Filtrar"
    Then solo debería ver movimientos dentro del rango
    And el resumen debería recalcularse con los datos filtrados

  Scenario: Ver proyección de ingresos futuros
    When accedo a la sección "Proyección"
    Then debería ver un gráfico con:
      | mes        | ingreso_esperado |
      | Noviembre  | $237,500         |
      | Diciembre  | $237,500         |
      | Enero      | $237,500         |
    And debería ver el total proyectado para el próximo año

  Scenario: Descargar estado de cuenta en PDF
    When hago clic en "Descargar PDF"
    Then debería descargarse un archivo PDF con:
      | contenido                      |
      | Logo de la entidad             |
      | Datos del titular              |
      | Período del reporte            |
      | Resumen de inversiones         |
      | Lista de CDT activos           |
      | Historial de movimientos       |
      | Firma digital                  |
      | Fecha de generación            |

  Scenario: Ver gráfico de crecimiento del patrimonio
    When accedo a la sección "Gráficos"
    Then debería ver un gráfico de línea que muestre:
      | eje_x          | eje_y                    |
      | Tiempo (meses) | Valor del patrimonio ($) |
    And debería poder cambiar entre vista mensual y anual
    And debería ver la tendencia de crecimiento
```

---

## 📊 Resumen de Historias de Usuario

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| HU-01 | Registro de Usuario | Alta | ✅ Implementada |
| HU-02 | Inicio de Sesión | Alta | ✅ Implementada |
| HU-03 | Cerrar Sesión | Alta | ✅ Implementada |
| HU-04 | Simulador de CDT | Alta | ✅ Implementada |
| HU-05 | Crear CDT | Alta | ✅ Implementada |
| HU-06 | Listar Mis CDT | Alta | ✅ Implementada |
| HU-07 | Ver Detalles de CDT | Media | ✅ Implementada |
| HU-08 | Enviar CDT a Revisión | Media | ✅ Implementada |
| HU-09 | Cancelar CDT | Media | ✅ Implementada |
| HU-10 | Aprobar CDT (Admin) | Alta | ✅ Implementada |
| HU-11 | Rechazar CDT (Admin) | Alta | ✅ Implementada |
| HU-12 | Ver Estado de Cuenta | Media | ✅ Implementada |

**Total:** 12 Historias de Usuario  
**Escenarios totales:** 58 casos de prueba en formato Gherkin

---

## 🎯 Cobertura de Testing

Estas historias de usuario están validadas con:

- **Tests E2E:** 60 tests con Playwright
- **Tests Unitarios:** 54 tests (100%)
- **Tests de Integración:** 52 tests (71%)

**Total:** 166 tests implementados que validan estos criterios de aceptación.

---

**Nota:** Este documento utiliza el formato Gherkin (Given-When-Then) que es estándar en BDD (Behavior Driven Development) y es compatible con herramientas como Cucumber, SpecFlow, y Behave.
