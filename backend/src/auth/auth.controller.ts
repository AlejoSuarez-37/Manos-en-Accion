import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { CurrentUser, Public, TokenService } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { AuthService } from './auth.service.js';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  type ChangePasswordDto,
  type LoginDto,
  type RefreshDto,
} from './auth.schemas.js';
import type { User } from '../users/user.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body({ schema: loginSchema }) body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body({ schema: refreshSchema }) body: RefreshDto) {
    return this.tokenService.refresh(body.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body({ schema: refreshSchema }) body: RefreshDto): Promise<void> {
    await this.tokenService.revoke(body.refreshToken);
  }

  @Get('me')
  @Can.Anyone()
  me(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me/password')
  @HttpCode(200)
  @Can.Anyone()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body({ schema: changePasswordSchema }) body: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(userId, body.currentPassword, body.newPassword);
    return { message: 'Password updated' };
  }
}
