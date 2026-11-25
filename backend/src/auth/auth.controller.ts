import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Public, SignInService } from '@nestjs/authentication';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Can } from '@nestjs/authorization';
import {
  ApiChangePassword,
  ApiLogin,
  ApiLogout,
  ApiMe,
} from './decorators/auth-swagger.decorator.js';
import { AuthService } from './auth.service.js';
import {
  changePasswordSchema,
  loginSchema,
  type ChangePasswordDto,
  type LoginDto,
} from '../schemas/auth.schemas.js';
import type { User } from '../users/entities/user.entity.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly signInService: SignInService,
  ) { }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  @ApiLogin()
  login(@Body({ schema: loginSchema }) body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiLogout()
  @Can.Anyone()
  async logout(): Promise<void> {
    await this.signInService.signOut();
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
    await this.authService.changePassword(
      userId,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password updated' };
  }
}