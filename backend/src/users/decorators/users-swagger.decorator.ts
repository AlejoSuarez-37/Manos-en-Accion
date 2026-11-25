import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiFindAllUsers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar usuarios',
      description:
        'Devuelve todos los usuarios registrados sin incluir información sensible como la contraseña.',
    }),
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
    ApiOperation({
      summary: 'Obtener usuario por ID',
      description:
        'Devuelve los datos públicos del usuario correspondiente al ID indicado.',
    }),
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
    ApiOperation({
      summary: 'Crear usuario',
      description:
        'Crea un nuevo usuario con rol editor y devuelve sus datos públicos. El correo debe ser único.',
    }),
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
    ApiOperation({
      summary: 'Actualizar usuario',
      description:
        'Actualiza los campos enviados de un usuario. No se puede modificar un administrador; si se cambia la contraseña se cierran todas sus sesiones.',
    }),
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
    ApiOperation({
      summary: 'Eliminar usuario',
      description:
        'Elimina un usuario y cierra todas sus sesiones. No se puede eliminar un administrador.',
    }),
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

export function ApiResetUserPassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Restablecer contraseña',
      description:
        'Genera una contraseña temporal, cierra todas las sesiones del usuario y la devuelve una única vez.',
    }),
    ApiResponse({
      status: 200,
      description: 'Contraseña temporal generada correctamente',
    }),
    ApiResponse({ status: 400, description: 'ID inválido' }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
    ApiResponse({
      status: 403,
      description: 'Sin permisos para restablecer contraseñas',
    }),
    ApiResponse({ status: 404, description: 'Usuario no encontrado' }),
  );
}
