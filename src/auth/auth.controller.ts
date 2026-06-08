import { Controller, Post, Body, Res, UseGuards, Request, UnauthorizedException, HttpCode, HttpStatus, Get } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto, ForgotPasswordDto } from './dto/password-mgmt.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    
    this.setTokens(res, result.access_token, result.refresh_token);
 
    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  async refresh(@Request() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token provided');

    const result = await this.authService.refreshTokens(refreshToken);
    this.setTokens(res, result.access_token, result.refresh_token);

    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken && req.user) {
      await this.authService.logout(req.user.id, refreshToken);
    }

    const isProd = ['production', 'staging'].includes(process.env.NODE_ENV || '');
    const cookieDomain = process.env.COOKIE_DOMAIN || '.sikshatantar.app';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
      domain: isProd ? cookieDomain : undefined,
    };

    res.clearCookie('access_token', cookieOptions);
    res.clearCookie('refresh_token', cookieOptions);
    res.clearCookie('cg_session', { ...cookieOptions, httpOnly: false });

    return { message: 'Logged out successfully' };
  }

  private setTokens(res: Response, access: string, refresh: string) {
    const isProd = ['production', 'staging'].includes(process.env.NODE_ENV || '');
    const cookieDomain = process.env.COOKIE_DOMAIN || '.sikshatantar.app';
    
    res.cookie('access_token', access, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: isProd ? cookieDomain : undefined,
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refresh_token', refresh, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: isProd ? cookieDomain : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('cg_session', 'true', {
      httpOnly: false, // Frontend needs to read this!
      secure: isProd,
      sameSite: 'lax',
      domain: isProd ? cookieDomain : undefined,
      maxAge: 7 * 24 * 60 * 60 * 1000, // Matches refresh_token (7 days)
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  changePassword(@Body() changePasswordDto: ChangePasswordDto, @Request() req: AuthenticatedRequest) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('debug')
  getDebugInfo(@Request() req: AuthenticatedRequest) {
    const refreshToken = req.cookies['refresh_token'];
    const accessToken = req.cookies['access_token'];
    return this.authService.getDebugInfo(req.user.id, refreshToken, accessToken);
  }
}
