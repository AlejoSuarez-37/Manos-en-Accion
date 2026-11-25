> **Proyecto:** Manos en Accion

> **Versión del documento:** 1.2

> **Fecha:** 2026-11-25

> **Autor(es):** Alejo Suarez / Matias Fernandez / Agustin Begue

> **Estado:** `Pendiente`

---

## Índice

1. [Control de Versiones del Documento](#control-de-versiones-del-documento)
2. [Requerimientos Funcionales](#requerimientos-funcionales)
3. [Requerimientos No Funcionales](#requerimientos-no-funcionales)

---

## Control de Versiones del Documento

| Versión | Fecha      | Autor          | Descripción del Cambio          |
|---------|------------|----------------|---------------------------------|
| 1.0     | 2026-11-16 | [Alejo Suarez] | Versión inicial del documento   |
| 1.1     | 2026-11-17 | [Alejo Suarez] | Incorporación del RF-008 al RF-015 |   
| 1.2     | 2026-11-25 | [Alejo Suarez] | Sesiones persistentes y ajuste de credenciales |   

---

## Requerimientos Funcionales

### RF-001 — Módulo de Noticias

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-001         |
| **Nombre**    | Módulo de Noticias |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> El administrador o editor accederá al panel de gestión de contenidos, donde se le presentará una interfaz para administrar las noticias y novedades institucionales (creación, listado, edición, eliminación y previsualización). El formulario contará con campos para título, cuerpo de texto enriquecido, carga de imágenes y selección de categoría o etiqueta.

```
El sistema debe permitir realizar las operaciones CRUD completas (crear, leer/listar, actualizar, eliminar) y previsualizar noticias y novedades institucionales. Cada publicación deberá almacenar obligatoriamente un título, cuerpo de texto, fecha de publicación, al menos una imagen asociada y una categoría/tag que permita el filtrado dinámico tanto en el panel administrativo como en la vista pública del sitio.
```

#### Criterios de Aceptación
- [x] El sistema debe impedir la publicación o guardado de una noticia si alguno de los campos obligatorios (título, cuerpo de texto, fecha de publicación o categoría) se encuentra vacío.
- [x] El usuario administrador/editor debe poder visualizar una vista previa (preview) de cómo se verá la noticia en el sitio público antes de confirmar su publicación.
- [x] El listado público y administrativo debe permitir filtrar las noticias en tiempo real según su categoría o tag asignado.
- [x] El servidor debe retornar el código HTTP 201 Created al registrar una noticia exitosamente y 200 OK al editarla.
- [x] El servidor debe retornar el código HTTP 204 No Content al eliminar una noticia exitosamente.

---

### RF-002 — Módulo de Equipo

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-002         |
| **Nombre**    | Módulo de Equipo |
| **Tipo**      | Funcional      |
| **Prioridad** | `Media`        |
| **Estado**    | `Pendiente`    |

#### Descripción
> El administrador o los editores podran acceder a la sección de gestión de equipo institucional dentro del panel de administración, donde se visualizará el listado actual de integrantes y dispondrá de opciones para agregar un nuevo miembro, editar su información o darlo de baja del sitio público.

```
El sistema debe permitir dar de alta, modificar datos (nombre, rol/cargo, breve biografía y fotografía) y dar de baja (eliminación lógica o física) a los miembros del equipo institucional, reflejando los cambios de manera inmediata en la sección correspondiente de la plataforma para mantener la información actualizada frente a la rotación de personal.
```

#### Criterios de Aceptación
- [x] El sistema debe validar que los campos obligatorios del integrante (nombre completo, cargo/rol y fotografía) estén completos antes de guardar el alta o la modificación.
- [x] Al dar de baja a un miembro del equipo, el sistema debe solicitar una confirmación explícita antes de ejecutar la acción.
- [x] Una vez dado de baja un integrante, su perfil debe dejar de renderizarse automáticamente en la vista pública de la sección "Equipo".
- [x] El servidor debe retornar 201 Created tras el alta de un nuevo miembro, 200 OK tras la actualización y 204 No Content despues de una baja exitosa.

---

### RF-003 — Módulo de Talleres y Ejes de Acción

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-003         |
| **Nombre**    | Módulo de Talleres y Ejes de Acción |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> El administrador o editor accederá al gestor de programas y actividades, donde podrá crear, editar, organizar y dar de baja talleres o iniciativas, asignándolos a un eje de acción institucional específico mediante un selector de clasificación.

```
El sistema debe permitir publicar y administrar talleres e iniciativas clasificados obligatoriamente dentro de los ejes de acción definidos por la organización, tales como "Proyectos Productivos" (ej. Gastronomía con Propósito) o "Voluntariados". Cada taller deberá incluir título, descripción, eje de acción al que pertenece, estado (activo/inactivo) e imagen representativa para su correcta agrupación y visualización en la web.
```

#### Criterios de Aceptación
- [x] El formulario de creación/edición debe exigir la selección de un Eje de Acción válido (Proyectos Productivos, Voluntariados, etc.) antes de permitir el guardado.
- [x] La vista pública debe agrupar los talleres publicados según el eje de acción al que fueron asignados.
- [x] El administrador debe poder cambiar el estado de un taller (ej. de activo a finalizado/inactivo) sin perder su registro histórico en la base de datos.
- [x] El servidor debe retornar 400 Bad Request si se intenta registrar un taller sin un eje de acción asociado o con datos inválidos.

---

### RF-004 — Gestión de Adjuntos PDF

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-004         |
| **Nombre**    | Gestión de Adjuntos PDF |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> Dentro de los formularios de edición de talleres, proyectos o secciones informativas, el administrador dispondrá de un componente de carga de archivos que le permitirá seleccionar documentos desde su dispositivo, asignarles un nombre visible y vincularlos al contenido correspondiente.

```
El sistema debe permitir la carga directa de archivos en formato PDF y asociarlos de forma dinámica a un taller, proyecto o sección informativa específica. Una vez vinculados, el sistema generará un enlace o botón de descarga pública directa en la vista correspondiente del sitio web, permitiendo también al administrador reemplazar o desvincular el archivo en cualquier momento.
```

#### Criterios de Aceptación
- [x] El sistema debe validar tanto en cliente como en servidor que el archivo subido corresponda estrictamente al formato application/pdf (.pdf) y no exceda el peso máximo permitido.
- [x] Si se intenta subir un archivo con un formato distinto a PDF, el sistema debe rechazar la carga y mostrar un mensaje de error descriptivo.
- [x] En la vista pública del taller, proyecto o sección asociada, debe renderizarse un botón de descarga que permita abrir o descargar el PDF directamente.
- [x] El servidor debe retornar 415 Unsupported Media Type si el archivo enviado no es un PDF válido y 201 Created cuando el adjunto se sube y asocia correctamente.

---

### RF-005 — Módulo de Marcas y Patrocinadores

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-005         |
| **Nombre**    | Módulo de Marcas y Patrocinadores |
| **Tipo**      | Funcional      |
| **Prioridad** | `Media`        |
| **Estado**    | `Pendiente`    |

#### Descripción
> El administrador accederá al apartado de "Aliados y Patrocinadores" en el panel de control, donde podrá gestionar el catálogo de organizaciones colaboradoras mediante un formulario de carga de logotipo, razón social/nombre y enlace web opcional.

```
El sistema debe permitir cargar, actualizar y remover los logotipos y nombres de las empresas aliadas y patrocinadores de triple impacto. Los registros activos se mostrarán automáticamente en la sección de aliados de la plataforma, manteniendo la integridad visual de sus isotipos/logotipos.
```

#### Criterios de Aceptación
- [x] El sistema debe exigir el nombre de la empresa/organización y el archivo de imagen del logotipo para registrar un nuevo patrocinador.
- [x] El administrador debe poder editar el nombre, reemplazar el logotipo o eliminar un patrocinador existente con confirmación previa.
- [x] Al eliminar o desactivar una marca, su logotipo debe dejar de mostrarse inmediatamente en la vista pública.
- [x] El servidor debe retornar 201 Created al dar de alta una nueva marca y 200 OK al actualizarla.
- [x] El servidor debe retornar 204 No Content al eliminar una marca exitosamente.

---

### RF-006 — Banner en Carrusel de la Landing Page

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-006         |
| **Nombre**    | Banner en Carrusel de la Landing Page |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> El administrador accederá a la configuración de portada (Landing Page), donde podrá subir, ordenar y eliminar las piezas gráficas (banners) que conformarán el carrusel principal del sitio web.

```
El sistema debe permitir cargar múltiples imágenes destinadas al banner principal de la Landing Page, las cuales se reproducirán y rotarán de manera cíclica y automática en la vista pública. El administrador podrá definir el orden de aparición, activar/desactivar diapositivas y eliminar banners obsoletos.
```

#### Criterios de Aceptación
- [x] El carrusel en la Landing Page debe rotar cíclicamente de forma automática entre todas las imágenes activas cargadas y permitir también la navegación manual (flechas o indicadores).
- [x] El administrador debe poder cargar nuevas imágenes, modificar su orden de visualización y eliminar imágenes existentes desde el panel de gestión.
- [x] Si existe una única imagen activa en el carrusel, esta debe mostrarse de forma estática sin generar errores de transición cíclica.
- [x] El servidor debe retornar 201 Created al subir un nuevo banner y 200 OK al actualizar el orden o eliminar una diapositiva.

---

### RF-007 — Sanitización y Estandarización de Imágenes

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-007         |
| **Nombre**    | Sanitización y Estandarización de Imágenes |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> En cada módulo que requiera la carga de archivos gráficos (noticias, equipo, talleres, patrocinadores y carrusel), la interfaz mostrará una etiqueta informativa con las dimensiones recomendadas/requeridas y aplicará validaciones sobre el archivo antes de almacenarlo.

```
Todas las imágenes subidas a la plataforma deberán ajustarse a un formato y dimensiones predefinidas según el módulo correspondiente (ej. relación de aspecto y resolución máxima/mínima). El sistema deberá mostrar de forma visible dichas especificaciones como recordatorio permanente para administradores y editores en cada campo de carga, validando o procesando (redimensionando/optimizando) las imágenes al momento de la subida para evitar deformaciones en la interfaz pública.
```

#### Criterios de Aceptación
- [x] Cada componente de carga de imágenes en el panel administrativo debe mostrar visiblemente un texto de ayuda/recordatorio indicando las dimensiones exactas o relación de aspecto esperada (ej. "Dimensiones recomendadas: 1920x600px, formato JPG/PNG/WebP").
- [x] El sistema debe validar que el archivo subido corresponda a un formato de imagen permitido (JPG, JPEG, PNG, WebP) y sanitizar el nombre del archivo para evitar caracteres especiales o vulnerabilidades.
- [x] Si una imagen no cumple con las dimensiones mínimas exigidas (o si se aplica recorte/redimensionamiento automático), el sistema debe notificar al usuario o ajustar la imagen manteniendo la relación de aspecto sin distorsionarla.
- [x] El servidor debe retornar 400 Bad Request o 415 Unsupported Media Type si se intenta subir un archivo corrupto o con un MIME type no permitido.

---

### RF-008 — Visitantes Públicos y Donaciones

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-008         |
| **Nombre**    | Visitantes Públicos y Donaciones |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> Los usuarios externos o visitantes que accedan a la plataforma pública podrán explorar las diferentes secciones informativas (noticias, talleres, equipo, etc.) y realizar aportes económicos o donaciones de forma directa, sin necesidad de pasar por un proceso previo de registro o inicio de sesión.

```
El sistema debe permitir a cualquier visitante público navegar por el contenido informativo del sitio web y realizar transacciones de donación sin requerir autenticación ni un registro previo de cuenta de usuario, garantizando un flujo de donación rápido, accesible y sin fricciones.
```

#### Criterios de Aceptación
- [x] El sistema debe permitir el acceso sin restricciones de autenticación a todas las vistas públicas (Landing Page, noticias, talleres, sobre nosotros, aliados).
- [x] El flujo de donación debe estar disponible para usuarios no autenticados, solicitando únicamente los datos indispensables para procesar el pago o registrar la contribución (ej. nombre opcional, correo electrónico para comprobante y datos de pago).
- [x] El servidor no debe exigir autenticación ni credenciales de usuario para procesar las solicitudes de lectura de contenidos públicos o registro de donaciones de invitados.
- [x] El servidor debe retornar el código HTTP 200 OK al consultar páginas públicas y 201 Created al registrar con éxito una donación realizada por un visitante.

---

### RF-009 — Rol Administrador

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-009         |
| **Nombre**    | Rol Administrador |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> El usuario con rol Administrador dispondrá de acceso total al panel de control, donde podrá gestionar contenidos dinámicos, administrar credenciales de pasarelas de pago/donación, modificar su propia contraseña y dar de alta o gestionar cuentas de usuarios con rol "Editor".

```
El sistema debe permitir que un usuario autenticado con rol "Administrador" edite todos los contenidos dinámicos del sitio, modifique su contraseña personal, cree y configure nuevos usuarios con el rol "Editor" (asignándoles nombre de usuario y contraseña) y modifique las credenciales de recepción de donaciones de la plataforma.
```

#### Criterios de Aceptación
- [x] El sistema debe validar que solo los usuarios con rol Administrador puedan acceder a la sección de gestión de usuarios, creación de editores y configuración de credenciales de donación.
- [x] Al crear un nuevo usuario con rol Editor, el sistema debe exigir un nombre visible, un correo electrónico válido y único y una contraseña segura, asociándoles correctamente el rol correspondiente.
- [x] El administrador debe poder actualizar las credenciales de las pasarelas o métodos de recepción de donaciones de forma segura, reflejándose en el procesamiento de pagos de manera inmediata.
- [x] El servidor debe retornar 201 Created al registrar un nuevo editor y 200 OK al actualizar contenidos, credenciales o la contraseña propia.
- [x] El administrador debe poder restablecer la contraseña de un Editor; la contraseña temporal se entrega una sola vez y se revocan todas sus sesiones activas.

---

### RF-010 — Rol Editor

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-010         |
| **Nombre**    | Rol Editor     |
| **Tipo**      | Funcional      |
| **Prioridad** | `Media`        |
| **Estado**    | `Pendiente`    |

#### Descripción
> El usuario con rol Editor ingresará al panel de administración con credenciales restringidas, donde su única función autorizada será la gestión y actualización de los contenidos dinámicos del portal y la modificación de su clave de acceso personal.

```
El sistema debe limitar las capacidades de los usuarios con rol "Editor" exclusivamente a la administración, creación, edición y previsualización de contenidos dinámicos (noticias, talleres, equipo, etc.) y a la modificación de su propia contraseña, bloqueando el acceso a la gestión de usuarios, configuración del sistema y credenciales financieras.
```

#### Criterios de Aceptación
- [x] El panel de control debe ocultar o denegar el acceso a las opciones de administración de usuarios y configuración de donaciones para cualquier usuario autenticado bajo el rol Editor.
- [x] El editor debe poder realizar las operaciones permitidas sobre los módulos de contenido (crear, editar, listar noticias, talleres, equipo, etc.) sin restricciones operativas en esas áreas.
- [x] El sistema debe permitir que el editor cambie su contraseña actual ingresando su clave anterior y una nueva contraseña que cumpla con los requisitos de seguridad.
- [x] El servidor debe retornar el código HTTP 403 Forbidden si un usuario con rol Editor intenta acceder a endpoints o rutas exclusivas del rol Administrador.

---

### RF-011 — Integración por API con Mercado Pago

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-011         |
| **Nombre**    | Integración por API con Mercado Pago |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> El visitante interesado en colaborar económicamente accederá a la sección de donaciones, donde seleccionará o ingresará el monto deseado bajo la opción principal por defecto (Mercado Pago). Al confirmar la acción, el sistema generará una preferencia de pago mediante la API y redirigirá al usuario hacia la pasarela externa de Mercado Pago para completar la transacción.

```
El sistema debe integrar el flujo de Checkout mediante la API oficial de Mercado Pago como método de donación principal por defecto. Al iniciar una donación, el backend deberá generar la preferencia de pago utilizando las credenciales vigentes configuradas por el administrador y redirigir al donante a la plataforma de Mercado Pago, procesando posteriormente el retorno y la confirmación del estado de la transacción.
```

#### Criterios de Aceptación
- [x] La opción de Mercado Pago debe presentarse seleccionada o destacada como método de donación principal por defecto en la interfaz de aportes.
- [x] El sistema debe validar que el monto de donación ingresado sea un valor numérico positivo mayor a cero antes de invocar la API de Mercado Pago.
- [x] Al confirmar el aporte, el servidor debe generar la preferencia de pago con las credenciales configuradas y redirigir correctamente al usuario al entorno de Checkout de Mercado Pago (init_point).
- [x] El sistema debe contemplar URLs de retorno (success, failure, pending) para informar al donante el resultado de su operación al volver al sitio web.
- [x] El servidor debe retornar 200 OK o 201 Created junto con la URL de redirección al generar la preferencia exitosamente, y 502 Bad Gateway o 400 Bad Request si ocurre un error de comunicación o credenciales inválidas con la API externa.

---

### RF-012 — Medios de Pago Alternativos

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-012         |
| **Nombre**    | Medios de Pago Alternativos |
| **Tipo**      | Funcional      |
| **Prioridad** | `Media`        |
| **Estado**    | `Pendiente`    |

#### Descripción
> Dentro de la misma sección de donaciones, el visitante visualizará un bloque informativo estructurado con las alternativas disponibles fuera de Mercado Pago, donde podrá consultar y copiar los datos bancarios locales o acceder mediante enlaces directos a las plataformas externas "Donar Online" y "Help".

```
El sistema debe disponer de una sección clara, visible y organizada dentro del módulo de donaciones que brinde la información completa y los accesos directos correspondientes para efectuar aportes mediante Transferencia Bancaria (datos de cuenta, CBU/CVU, Alias, CUIT/Titular), así como los enlaces hacia las plataformas externas "Donar Online" (donaciones recurrentes/locales) y "Help" (canal destinado a donaciones internacionales).
```

#### Criterios de Aceptación
- [x] La sección de medios alternativos debe mostrar de forma legible todos los datos necesarios para realizar una Transferencia Bancaria (Banco, Tipo de cuenta, Titular, CUIT, CBU/CVU y Alias), incluyendo una acción rápida para copiar dichos datos al portapapeles.
- [x] El sitio debe incluir botones o enlaces claramente identificados que redirijan en una nueva pestaña hacia las plataformas externas Donar Online y  El sitio debe incluir botones o enlaces claramente identificados que redirijan en una nueva pestaña hacia las plataformas externas Donar Online y Help (especificando que esta última corresponde a donaciones internacionales).
- [x] El administrador debe poder actualizar los datos bancarios y las URLs de acceso de estos medios alternativos desde el panel de configuración sin requerir cambios en el código fuente.
- [x] Todos los enlaces externos deben abrirse de forma segura sin hacer que el usuario pierda la sesión o contexto de navegación en el sitio institucional.

---

### RF-013 — Botón Flotante de WhatsApp

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-013         |
| **Nombre**    | Botón Flotante de WhatsApp |
| **Tipo**      | Funcional      |
| **Prioridad** | `Media`        |
| **Estado**    | `Pendiente`    |

#### Descripción
> Durante su navegación por cualquier vista pública de la plataforma, el visitante visualizará un botón flotante ubicado de forma fija en la esquina inferior de la pantalla. Al seleccionarlo, el sistema abrirá la aplicación o versión web de WhatsApp iniciando un chat directo con la línea de atención oficial de la organización.

```
El sistema debe integrar un widget flotante persistente en la interfaz pública del sitio web que redirija mediante enlace oficial o API de WhatsApp hacia el número telefónico oficial configurado por la ONG, permitiendo iniciar una conversación directa con un mensaje predeterminado opcional.
```

#### Criterios de Aceptación
- [x] El botón flotante de WhatsApp debe mantenerse visible y accesible de manera fija (posición fixed) en todas las vistas públicas, sin obstruir elementos críticos de navegación o botones de acción.
- [x] Al hacer clic en el widget, se debe abrir una nueva pestaña (target="_blank" con rel="noopener noreferrer") redirigiendo a la URL oficial de WhatsApp con el número telefónico institucional correctamente formateado (código de país incluido).
- [x] El widget no debe renderizarse dentro del panel privado de administración/edición para evitar interferencias visuales en la gestión interna.
- [x] El número telefónico oficial asociado al enlace debe poder ser actualizado desde la configuración del panel administrativo sin requerir modificaciones en el código fuente.

---

### RF-014 — Contacto Empresarial

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-014         |
| **Nombre**    | Contacto Empresarial |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> Las empresas, instituciones o potenciales aliados accederán a la sección de contacto del sitio, donde encontrarán un formulario dedicado para consultas corporativas con campos para correo electrónico, título/asunto y mensaje. Al enviarlo, el sistema remitirá el correo directamente a la casilla oficial de la ONG.

```
El sistema debe proveer un formulario en la sección de contacto destinado a consultas empresariales o institucionales, compuesto por campos obligatorios para correo electrónico del remitente, título (asunto) y cuerpo de texto. Al confirmar el envío, el servidor procesará la solicitud y enviará un correo electrónico a la dirección oficial configurada por la asociación, incluyendo el remitente como dirección de respuesta (Reply-To).
```

#### Criterios de Aceptación
- [x] El formulario debe validar en cliente y servidor que los campos de correo electrónico, título y cuerpo del mensaje estén completos y que el e-mail cumpla con un formato válido.
- [x] Al enviarse correctamente, el sistema debe despachar un correo electrónico a la casilla oficial de la ONG con el título ingresado por el usuario y los datos del remitente.
- [x] La interfaz debe mostrar una notificación clara de confirmación de envío exitoso y limpiar los campos del formulario para evitar envíos duplicados accidentales.
- [x] El servidor debe retornar el código HTTP 200 OK cuando el correo se envíe satisfactoriamente, 400 Bad Request si existen errores de validación y 502 Bad Gateway o 500 Internal Server Error si falla el servicio de mensajería SMTP/API.

---

### RF-015 — Contacto Voluntario

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RF-015         |
| **Nombre**    | Contacto Voluntario |
| **Tipo**      | Funcional      |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> Las personas interesadas en sumarse como voluntarias accederán al formulario correspondiente dentro de la sección de contacto o voluntariado, donde ingresarán su dirección de correo electrónico y una presentación o mensaje en el cuerpo de texto. El sistema enviará dicha postulación automáticamente a la casilla de la ONG bajo un asunto estandarizado.

```
El sistema debe habilitar un formulario específico para postulantes a voluntariado que solicite obligatoriamente el correo electrónico del interesado y el cuerpo del mensaje. Al enviarse el formulario, el sistema despachará un correo electrónico a la casilla oficial de la ONG estableciendo de forma automática y predefinida el asunto exacto "Postulante a Voluntariado".
```

#### Criterios de Aceptación
- [x] El formulario debe exigir el ingreso de un correo electrónico con formato válido y un cuerpo de mensaje no vacío antes de habilitar o procesar el envío.
- [x] El correo electrónico generado hacia la ONG debe contener obligatoriamente el asunto predefinido "Postulante a Voluntariado" sin requerir que el usuario lo escriba manualmente.
- [x] El mensaje recibido por la organización debe incluir claramente el correo electrónico del postulante (y configurarlo en el encabezado Reply-To) para facilitar la respuesta directa.
- [x] El servidor debe retornar 200 OK tras procesar y enviar la postulación exitosamente, y 400 Bad Request si alguno de los campos requeridos es inválido o está vacío.

---

## Requerimientos No Funcionales

### RNF-001 — Autenticación y sesiones

| Campo         | Detalle        |
|---------------|----------------|
| **ID**        | RNF-001        |
| **Nombre**    | Autenticación y sesiones |
| **Tipo**      | No Funcional   |
| **Prioridad** | `Alta`         |
| **Estado**    | `Pendiente`    |

#### Descripción
> El usuario del panel administrativo accede mediante credenciales de correo electrónico y contraseña. El servidor mantiene la sesión y envía al navegador una cookie HttpOnly, de modo que no sea necesario exponer tokens en la respuesta ni almacenarlos en el cliente.

```
El sistema debe autenticar a administradores y editores con sesiones persistentes en el servidor, representadas por una cookie HttpOnly, Secure en producción y SameSite Lax. Las sesiones deben expirar por inactividad y por duración total máxima, configurable mediante variables de entorno, y deben revocarse al cerrar sesión, al cambiar la contraseña propia, al restablecer una contraseña desde administración, al modificar la clave de un usuario o al darlo de baja. El acceso público y el flujo de donaciones de visitantes no deben requerir sesión.
```

#### Criterios de Aceptación
- [x] La autenticación debe basarse en sesiones persistentes en el servidor y una cookie HttpOnly; la respuesta de login no debe incluir tokens de acceso ni de actualización.
- [x] La cookie debe enviarse con `Secure` en producción y con `SameSite=Lax`, y el navegador debe reenviarla automáticamente en las solicitudes al panel.
- [x] La sesión debe dejar de ser válida al superar el tiempo de inactividad configurado (`1d` por defecto) o el tiempo total configurado (`7d` por defecto).
- [x] El cierre de sesión, el cambio de contraseña propia, el restablecimiento por administrador, la actualización de clave y la baja de usuario deben revocar las sesiones correspondientes.
- [x] El sistema debe limitar los intentos de inicio de sesión a 10 por dirección IP por minuto y 5 por cuenta cada 15 minutos.
- [x] Las solicitudes autenticadas deben validar el origen de la petición y permitir credenciales solo para los orígenes configurados.
- [x] Las solicitudes del sitio público y de donaciones de visitantes no deben exigir sesión ni credenciales.