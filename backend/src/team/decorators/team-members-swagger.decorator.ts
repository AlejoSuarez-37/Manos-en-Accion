import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

const teamMemberFields = {
  name: { type: 'string', example: 'Ana Pérez' },
  role: { type: 'string', example: 'Coordinadora' },
  bio: { type: 'string', example: 'Breve biografía' },
};

const imageField = {
  image: { type: 'string', format: 'binary' },
};

export function ApiFindTeamMembers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar miembros del equipo',
      description:
        'Devuelve los integrantes actuales del equipo para la vista pública.',
    }),
    ApiResponse({ status: 200, description: 'Miembros obtenidos correctamente' }),
  );
}

export function ApiFindOneTeamMember() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener miembro del equipo por ID',
      description: 'Devuelve un integrante del equipo por su identificador.',
    }),
    ApiResponse({ status: 200, description: 'Miembro obtenido correctamente' }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
    ApiResponse({ status: 404, description: 'Miembro no encontrado' }),
  );
}

export function ApiCreateTeamMember() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear miembro del equipo',
      description:
        'Crea un integrante con nombre, rol, biografía opcional y fotografía. La imagen se sube a Cloudinary y se recorta a 1:1 al construir su URL.',
    }),
    ApiBody({
      description: 'Datos del miembro y archivo de imagen',
      schema: {
        type: 'object',
        required: ['name', 'role', 'image'],
        properties: { ...teamMemberFields, ...imageField },
      },
    }),
    ApiResponse({ status: 201, description: 'Miembro creado correctamente' }),
    ApiResponse({ status: 400, description: 'Datos inválidos o imagen demasiado grande' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
    ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
    ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
  );
}

export function ApiUpdateTeamMember() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar miembro del equipo',
      description:
        'Actualiza los campos enviados. Si se adjunta una nueva imagen, se reemplaza la anterior.',
    }),
    ApiBody({
      description: 'Campos a actualizar y, opcionalmente, una nueva imagen',
      schema: {
        type: 'object',
        properties: { ...teamMemberFields, ...imageField },
      },
    }),
    ApiResponse({ status: 200, description: 'Miembro actualizado correctamente' }),
    ApiResponse({ status: 400, description: 'Datos inválidos o imagen demasiado grande' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
    ApiResponse({ status: 404, description: 'Miembro no encontrado' }),
    ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
    ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
  );
}

export function ApiDeleteTeamMember() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar un miembro del equipo',
      description:
        'Elimina el registro de PostgreSQL y su imagen de Cloudinary. Solo responde 204 si ambas operaciones terminan correctamente.',
    }),
    ApiResponse({ status: 204, description: 'Miembro e imagen eliminados correctamente' }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
    ApiResponse({ status: 404, description: 'Miembro no encontrado' }),
    ApiResponse({ status: 502, description: 'Fallo al eliminar la imagen' }),
  );
}
