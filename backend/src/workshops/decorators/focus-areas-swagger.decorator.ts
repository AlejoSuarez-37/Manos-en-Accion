import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

const focusAreaFields = {
  name: { type: 'string', example: 'Proyectos Productivos' },
  description: {
    type: 'string',
    example: 'Iniciativas que generan ingresos y autonomía institucional',
  },
};

const imageField = {
  image: { type: 'string', format: 'binary' },
};

export function ApiFindFocusAreas() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar ejes de acción',
      description:
        'Devuelve los ejes de acción con sus talleres agrupados para la vista pública.',
    }),
    ApiResponse({ status: 200, description: 'Ejes obtenidos correctamente' }),
  );
}

export function ApiFindOneFocusArea() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener eje de acción por ID',
      description: 'Devuelve un eje con sus talleres asociados.',
    }),
    ApiResponse({ status: 200, description: 'Eje obtenido correctamente' }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 404, description: 'Eje no encontrado' }),
  );
}

export function ApiCreateFocusArea() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear eje de acción',
      description:
        'Crea un eje con nombre, descripción opcional e imagen. La imagen se guarda en Cloudinary y en PostgreSQL solo su clave.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Datos del eje y archivo de imagen',
      schema: {
        type: 'object',
        required: ['name', 'image'],
        properties: { ...focusAreaFields, ...imageField },
      },
    }),
    ApiResponse({ status: 201, description: 'Eje creado correctamente' }),
    ApiResponse({
      status: 400,
      description: 'Datos inválidos o imagen demasiado grande',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
    ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
  );
}

export function ApiUpdateFocusArea() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar eje de acción',
      description:
        'Actualiza los campos enviados. Si se adjunta una nueva imagen, se reemplaza la anterior.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Campos a actualizar y, opcionalmente, una nueva imagen',
      schema: {
        type: 'object',
        properties: { ...focusAreaFields, ...imageField },
      },
    }),
    ApiResponse({ status: 200, description: 'Eje actualizado correctamente' }),
    ApiResponse({
      status: 400,
      description: 'Datos inválidos o imagen demasiado grande',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({ status: 404, description: 'Eje no encontrado' }),
    ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
    ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
  );
}

export function ApiDeleteFocusArea() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar eje de acción',
      description:
        'Elimina el eje y su imagen de Cloudinary. Falla con 409 si todavía tiene talleres asociados.',
    }),
    ApiResponse({
      status: 204,
      description: 'Eje e imagen eliminados correctamente',
    }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({
      status: 409,
      description: 'El eje tiene talleres asociados y no puede eliminarse',
    }),
    ApiResponse({ status: 404, description: 'Eje no encontrado' }),
    ApiResponse({ status: 502, description: 'Fallo al eliminar la imagen' }),
  );
}
