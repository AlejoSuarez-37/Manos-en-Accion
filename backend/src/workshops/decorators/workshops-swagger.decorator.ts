import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

const workshopFields = {
  title: { type: 'string', example: 'Gastronomía con Propósito' },
  description: {
    type: 'string',
    example: 'Taller de cocina solidaria para emprendimientos comunitarios',
  },
  focusAreaId: { type: 'string', format: 'uuid' },
  pdfName: { type: 'string', example: 'Programa del taller' },
};

const fileFields = {
  image: { type: 'string', format: 'binary' },
  pdf: { type: 'string', format: 'binary' },
};

export function ApiFindWorkshops() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar talleres',
      description:
        'Devuelve los talleres para la vista pública, opcionalmente filtrados por eje de acción.',
    }),
    ApiQuery({
      name: 'focusAreaId',
      required: false,
      description: 'ID del eje de acción por el que se filtran los talleres',
    }),
    ApiResponse({
      status: 200,
      description: 'Talleres obtenidos correctamente',
    }),
    ApiResponse({ status: 400, description: 'Filtro inválido' }),
  );
}

export function ApiFindOneWorkshop() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener taller por ID',
      description:
        'Devuelve el taller con la URL de su PDF si tiene uno adjunto.',
    }),
    ApiResponse({ status: 200, description: 'Taller obtenido correctamente' }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 404, description: 'Taller no encontrado' }),
  );
}

export function ApiCreateWorkshop() {
  return applyDecorators(
    ApiOperation({
      summary: 'Crear taller',
      description:
        'Crea un taller con imagen obligatoria y PDF opcional, asociado a un eje de acción válido.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Datos del taller, imagen y PDF opcional',
      schema: {
        type: 'object',
        required: ['title', 'description', 'focusAreaId', 'image'],
        properties: { ...workshopFields, ...fileFields },
      },
    }),
    ApiResponse({ status: 201, description: 'Taller creado correctamente' }),
    ApiResponse({
      status: 400,
      description:
        'Datos inválidos, eje inexistente o archivo demasiado grande',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({
      status: 415,
      description: 'Formato de imagen o PDF no permitido',
    }),
    ApiResponse({ status: 502, description: 'Fallo al guardar los archivos' }),
  );
}

export function ApiUpdateWorkshop() {
  return applyDecorators(
    ApiOperation({
      summary: 'Actualizar taller',
      description:
        'Actualiza los campos enviados. Reemplaza la imagen o el PDF cuando se adjuntan archivos nuevos.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Campos a actualizar y, opcionalmente, imagen y PDF nuevos',
      schema: {
        type: 'object',
        properties: { ...workshopFields, ...fileFields },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Taller actualizado correctamente',
    }),
    ApiResponse({
      status: 400,
      description:
        'Datos inválidos, eje inexistente o archivo demasiado grande',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({ status: 404, description: 'Taller no encontrado' }),
    ApiResponse({
      status: 415,
      description: 'Formato de imagen o PDF no permitido',
    }),
    ApiResponse({ status: 502, description: 'Fallo al guardar los archivos' }),
  );
}

export function ApiDeleteWorkshopPdf() {
  return applyDecorators(
    ApiOperation({
      summary: 'Desvincular el PDF de un taller',
      description:
        'Elimina el PDF adjunto de Cloudinary y deja el campo pdf vacío en PostgreSQL.',
    }),
    ApiResponse({ status: 204, description: 'PDF eliminado correctamente' }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({
      status: 404,
      description: 'Taller sin PDF adjunto o inexistente',
    }),
    ApiResponse({ status: 502, description: 'Fallo al eliminar el PDF' }),
  );
}

export function ApiDeleteWorkshop() {
  return applyDecorators(
    ApiOperation({
      summary: 'Eliminar taller',
      description:
        'Elimina el taller, su imagen y su PDF de Cloudinary. Solo responde 204 si todas las operaciones terminan correctamente.',
    }),
    ApiResponse({
      status: 204,
      description: 'Taller, imagen y PDF eliminados correctamente',
    }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para gestionar contenido',
    }),
    ApiResponse({ status: 404, description: 'Taller no encontrado' }),
    ApiResponse({ status: 502, description: 'Fallo al eliminar los archivos' }),
  );
}
