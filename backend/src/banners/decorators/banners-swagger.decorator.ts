import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

const imageField = {
    image: { type: 'string', format: 'binary' },
};

export function ApiFindBanners() {
    return applyDecorators(
        ApiOperation({
            summary: 'Listar banners del carrusel',
            description:
                'Devuelve las imágenes del carrusel público ordenadas por position, sin exponer la clave de Cloudinary.',
        }),
        ApiResponse({
            status: 200,
            description: 'Banners obtenidos correctamente',
        }),
    );
}

export function ApiFindOneBanner() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obtener banner por ID',
            description: 'Devuelve un banner por su identificador.',
        }),
        ApiResponse({ status: 200, description: 'Banner obtenido correctamente' }),
        ApiResponse({ status: 400, description: 'ID inválido' }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 404, description: 'Banner no encontrado' }),
    );
}

export function ApiCreateBanner() {
    return applyDecorators(
        ApiOperation({
            summary: 'Crear banner',
            description:
                'Sube una imagen al carrusel y asigna automáticamente la última posición. Dimensiones recomendadas: 1920x600px, JPG/PNG/WebP, máximo 5 MiB.',
        }),
        ApiBody({
            description: 'Archivo de imagen del banner',
            schema: {
                type: 'object',
                required: ['image'],
                properties: { ...imageField },
            },
        }),
        ApiResponse({ status: 201, description: 'Banner creado correctamente' }),
        ApiResponse({
            status: 400,
            description: 'Falta la imagen o supera el peso máximo',
        }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
        ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
    );
}

export function ApiUpdateBanner() {
    return applyDecorators(
        ApiOperation({
            summary: 'Actualizar banner',
            description:
                'Actualiza la posición y/o la imagen. Los campos vacíos se ignoran y no modifican el banner. Si se adjunta una nueva imagen, se reemplaza la anterior.',
        }),
        ApiBody({
            description: 'Posición a actualizar y, opcionalmente, una nueva imagen',
            schema: {
                type: 'object',
                properties: {
                    position: {
                        type: 'integer',
                        minimum: 1,
                        example: 2,
                    },
                    ...imageField,
                },
            },
        }),
        ApiResponse({ status: 200, description: 'Banner actualizado correctamente' }),
        ApiResponse({
            status: 400,
            description:
                'Datos inválidos, falta posición e imagen o la imagen supera el peso máximo',
        }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 404, description: 'Banner no encontrado' }),
        ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
        ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
    );
}

export function ApiDeleteBanner() {
    return applyDecorators(
        ApiOperation({
            summary: 'Eliminar un banner',
            description:
                'Elimina el registro de PostgreSQL y su imagen de Cloudinary. Después decrementa en 1 la posición de los banners que estaban por detrás. Solo responde 204 si todas las operaciones terminan correctamente.',
        }),
        ApiResponse({
            status: 204,
            description: 'Banner e imagen eliminados correctamente',
        }),
        ApiResponse({ status: 400, description: 'ID inválido' }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 404, description: 'Banner no encontrado' }),
        ApiResponse({ status: 502, description: 'Fallo al eliminar la imagen' }),
    );
}
