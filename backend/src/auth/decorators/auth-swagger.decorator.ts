import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiLogin() {
  return applyDecorators(
    ApiOperation({
      summary: 'Iniciar sesión',
      description:
        'Valida el correo y la contraseña, crea una sesión y devuelve los datos públicos del usuario en una cookie HttpOnly.',
    }),
    ApiResponse({ status: 200, description: 'Inicio de sesión correcto' }),
    ApiResponse({ status: 400, description: 'Datos inválidos' }),
    ApiResponse({
      status: 401,
      description: 'Correo o contraseña incorrectos',
    }),
    ApiResponse({
      status: 403,
      description: 'Origen no permitido para iniciar sesión',
    }),
  );
}

export function ApiLogout() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cerrar sesión',
      description:
        'Elimina la sesión actual y limpia la cookie. No requiere cuerpo.',
    }),
    ApiResponse({ status: 204, description: 'Sesión cerrada correctamente' }),
    ApiResponse({ status: 403, description: 'Origen no permitido' }),
  );
}

export function ApiMe() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtener usuario autenticado',
      description:
        'Devuelve los datos públicos del usuario asociado a la sesión de la cookie.',
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
        'Verifica la contraseña actual, guarda la nueva, rota la sesión actual y cierra las demás.',
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