> **Proyecto:** Manos en Accion

> **Versión del documento:** 1.0

> **Fecha:** 2026-06-25

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
| 1.0     | 2026-05-04 | [Alejo Suarez] | Versión inicial del documento   |

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





## Requerimientos No Funcionales