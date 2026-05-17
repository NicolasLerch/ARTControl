Quiero construir una web app desktop-first para gestión de turnos de medicina laboral.

Importante:
La empresa ya tiene un sistema oficial donde se registran siniestros, evoluciones, recetas y datos clínicos completos. Esta app NO reemplaza ese sistema. Solo debe funcionar como turnero paralelo para organizar controles.
El frontend ya esta bastante avanzado, intenta usar ya la estructura esa. Nos focalicemos en el backend.

Stack:
- React + TypeScript + Vite
- TailwindCSS + shadcn/ui
- Node.js + Express
- PostgreSQL
- Prisma ORM
- Zod para validaciones
- Auth con email/password + 2FA TOTP
- Sesiones con cookies httpOnly

MVP:
1. Login seguro con 2FA.
2. Pantalla inicial con calendario.
3. Panel lateral con turnos del día actual.
4. CRUD de pacientes:
   - nombre
   - apellido
   - DNI
No son necesario todos los otros datos que da el frontend actualmente.
5. Registro de atenciones:
   - paciente_id
   - fecha_atencion
   - observaciones
6. CRUD de turnos/controles:
   - paciente_id
   - fecha
   - hora
   - estado: pendiente, asistió, no asistió, cancelado
   - observaciones
7. Modal para agregar turno:
   - buscar paciente por DNI/apellido, busqueda indexada
   - seleccionar paciente existente
   - crear paciente rápido si no existe
   - elegir fecha y hora
   - agregar observaciones
8. Vista de detalle del paciente:
   - datos básicos
   - timeline de atenciones y turnos
   - botón para citar nuevo control
9. Pestañas:
   - Turnos
   - Pacientes
   - Pacientes atendidos hoy
   - Vademécum
   - Farmacias
   - Horarios especialistas

Para el MVP, las pestañas Vademécum, Farmacias y Horarios especialistas, si bien ya estan hechas, simplemente las vamos a dejar en standby, como "proximamente"

Seguridad:
- No guardar tokens en localStorage.
- Usar cookies httpOnly, secure y sameSite.
- Hash de contraseña con Argon2 o bcrypt.
- 2FA TOTP compatible con Google Authenticator/Authy/Microsoft Authenticator.
- Roles simples: ADMIN y USER.
- Middleware de autenticación y autorización.
- Rate limit en login.
- Validación con Zod en backend.
- Guardar la menor cantidad posible de datos clínicos.

Primero generá:
1. Estructura de carpetas.
2. Schema Prisma.
3. Rutas backend necesarias.
4. Componentes principales de frontend.
5. Plan de implementación por etapas.

No escribas toda la app de una vez. Primero armemos la base del proyecto y luego avancemos módulo por módulo.