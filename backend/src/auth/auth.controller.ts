import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { CurrentUser, Public, TokenService } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import {
  ApiChangePassword,
  ApiLogin,
  ApiLogout,
  ApiMe,
  ApiRefresh,
} from './decorators/auth-swagger.decorator.js';
import { AuthService } from './auth.service.js';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  type ChangePasswordDto,
  type LoginDto,
  type RefreshDto,
} from '../schemas/auth.schemas.js';
import type { User } from '../users/entities/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiLogin()
  login(@Body({ schema: loginSchema }) body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiRefresh()
  refresh(@Body({ schema: refreshSchema }) body: RefreshDto) {
    return this.tokenService.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  @ApiLogout()
  async logout(@Body({ schema: refreshSchema }) body: RefreshDto): Promise<void> {
    await this.tokenService.revoke(body.refreshToken);
  }

  @Get('me')
  @ApiMe()
  @Can.Anyone()
  me(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me/password')
  @HttpCode(200)
  @ApiChangePassword()
  @Can.Anyone()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body({ schema: changePasswordSchema }) body: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    return { message: 'Password updated' };
  }
}
