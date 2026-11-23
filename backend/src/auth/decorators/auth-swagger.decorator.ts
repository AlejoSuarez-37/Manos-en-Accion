import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Iniciar sesión',
      description:
        'Valida el correo y la contraseña y devuelve un token de acceso y un token de actualización.',
    }),
    ApiResponse({ status: 200, description: 'Inicio de sesión correcto' }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({
      status: 401,
      description: 'Correo o contraseña incorrectos',
    }),
  );
}

export function ApiRefresh() {
  return applyDecorators(
    ApiOperation({
      summary: 'Renovar tokens',
      description:
        'Canjea un token de actualización por un nuevo par de tokens e invalida el anterior.',
    }),
    ApiResponse({ status: 200, description: 'Tokens renovados correctamente' }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({
      status: 401,
      description: 'Token de actualización inválido o expirado',
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cerrar sesión',
      description:
        'Revoca el token de actualización enviado y cierra la sesión actual.',
    }),
    ApiResponse({ status: 204, description: 'Sesión cerrada correctamente' }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
  );
}

export function ApiMe() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener usuario autenticado',
      description:
        'Devuelve los datos públicos del usuario asociado al token de acceso vigente.',
    }),
    ApiResponse({
      status: 200,
      description: 'Usuario autenticado obtenido correctamente',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
  );
}

export function ApiChangePassword() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cambiar contraseña',
      description:
        'Verifica la contraseña actual, guarda la nueva y revoca todos los tokens del usuario.',
    }),
    ApiResponse({
      status: 200,
      description: 'Contraseña actualizada correctamente',
    }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({
      status: 401,
      description: 'No autenticado o contraseña actual incorrecta',
    }),
  );
}
