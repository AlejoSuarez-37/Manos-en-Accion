import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
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
    ApiResponse({ status: 204, description: 'Sesión cerrada correctamente' }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
  );
}

export function ApiMe() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: 'Usuario autenticado obtenido correctamente',
    }),
    ApiResponse({ status: 401, description: 'No autenticado' }),
  );
}

export function ApiChangePassword() {
  return applyDecorators(
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
