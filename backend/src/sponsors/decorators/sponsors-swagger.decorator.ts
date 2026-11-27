import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { sponsorCategories } from '../entities/sponsor.entity.js';

const sponsorFields = {
    name: { type: 'string', example: 'Marca Ejemplo' },
    category: {
        type: 'string',
        enum: [...sponsorCategories],
        example: 'corporate_support',
    },
    websiteUrl: {
        type: 'string',
        nullable: true,
        example: 'https://www.marca.org',
    },
};

const imageField = {
    image: { type: 'string', format: 'binary' },
};

export function ApiFindSponsors() {
    return applyDecorators(
        ApiOperation({
            summary: 'Listar sponsors',
            description:
                'Devuelve las marcas para la vista pública. El query param category es opcional y filtra por sección.',
        }),
        ApiQuery({
            name: 'category',
            required: false,
            enum: [...sponsorCategories],
            description: 'corporate_support o friend_organizations',
        }),
        ApiResponse({ status: 200, description: 'Sponsors obtenidos correctamente' }),
        ApiResponse({ status: 400, description: 'Categoría inválida' }),
    );
}

export function ApiFindOneSponsor() {
    return applyDecorators(
        ApiOperation({
            summary: 'Obtener sponsor por ID',
            description: 'Devuelve una marca por su identificador.',
        }),
        ApiResponse({ status: 200, description: 'Sponsor obtenido correctamente' }),
        ApiResponse({ status: 400, description: 'ID inválido' }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 404, description: 'Sponsor no encontrado' }),
    );
}

export function ApiCreateSponsor() {
    return applyDecorators(
        ApiOperation({
            summary: 'Crear sponsor',
            description:
                'Crea una marca con nombre, categoría, link opcional y logo. El logo se sube a Cloudinary y se entrega dentro de 1000x1000 conservando su proporción, sin recorte ni agrandado.',
        }),
        ApiBody({
            description: 'Datos del sponsor y archivo de imagen',
            schema: {
                type: 'object',
                required: ['name', 'category', 'image'],
                properties: { ...sponsorFields, ...imageField },
            },
        }),
        ApiResponse({ status: 201, description: 'Sponsor creado correctamente' }),
        ApiResponse({
            status: 400,
            description: 'Datos inválidos, URL no http/https o imagen demasiado grande',
        }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
        ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
    );
}

export function ApiUpdateSponsor() {
    return applyDecorators(
        ApiOperation({
            summary: 'Actualizar sponsor',
            description:
                'Actualiza los campos enviados. websiteUrl vacío limpia el link. Si se adjunta una nueva imagen, se reemplaza la anterior.',
        }),
        ApiBody({
            description: 'Campos a actualizar y, opcionalmente, un nuevo logo',
            schema: {
                type: 'object',
                properties: { ...sponsorFields, ...imageField },
            },
        }),
        ApiResponse({ status: 200, description: 'Sponsor actualizado correctamente' }),
        ApiResponse({
            status: 400,
            description: 'Datos inválidos, URL no http/https o imagen demasiado grande',
        }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 404, description: 'Sponsor no encontrado' }),
        ApiResponse({ status: 415, description: 'Formato de imagen no permitido' }),
        ApiResponse({ status: 502, description: 'Fallo al guardar la imagen' }),
    );
}

export function ApiDeleteSponsor() {
    return applyDecorators(
        ApiOperation({
            summary: 'Eliminar un sponsor',
            description:
                'Elimina el registro de PostgreSQL y su logo de Cloudinary. Solo responde 204 si ambas operaciones terminan correctamente.',
        }),
        ApiResponse({ status: 204, description: 'Sponsor y logo eliminados correctamente' }),
        ApiResponse({ status: 400, description: 'ID inválido' }),
        ApiResponse({ status: 401, description: 'No autenticado' }),
        ApiResponse({ status: 403, description: 'Sin permisos para gestionar contenido' }),
        ApiResponse({ status: 404, description: 'Sponsor no encontrado' }),
        ApiResponse({ status: 502, description: 'Fallo al eliminar la imagen' }),
    );
}