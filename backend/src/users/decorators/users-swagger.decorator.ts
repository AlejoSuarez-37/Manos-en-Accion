import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiFindAllUsers() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Usuarios obtenidos correctamente',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para ver los usuarios',
    }),
  );
}

export function ApiFindOneUser() {
  return applyDecorators(
    ApiResponse({ status: 200, description: 'Usuario obtenido correctamente' }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para ver los usuarios',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  );
}

export function ApiCreateUser() {
  return applyDecorators(
    ApiResponse({ status: 201, description: 'Usuario creado correctamente' }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para crear usuarios',
    }),
    ApiResponse({
      status: 409,
      description: 'Ya existe un usuario con ese correo',
    }),
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Usuario actualizado correctamente',
    }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para actualizar usuarios',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
    ApiResponse({
      status: 409,
      description: 'Ya existe un usuario con ese correo',
    }),
  );
}

export function ApiDeleteUser() {
  return applyDecorators(
    ApiResponse({
      status: 204,
      description: 'Usuario eliminado correctamente',
    }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para eliminar usuarios',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  );
}
