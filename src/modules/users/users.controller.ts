import { Controller, Post, Body, UseGuards, Request, Get, Query, Patch, UseInterceptors, UploadedFile, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('global')
  @Roles(UserRole.SUPER_ADMIN)
  getGlobalAdmins() {
    return this.usersService.findGlobalAdmins();
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  searchUsers(
    @Query('q') query: string,
    @Query('role') role: UserRole,
    @Request() req: any
  ) {
    return this.usersService.searchInSchool(query, role, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('unassigned')
  findUnassigned(@Query('role') role: UserRole, @Request() req: any) {
    return this.usersService.findUnassigned(role, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req: any) {
    return this.usersService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile/photo')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePhoto(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateProfilePhoto(req.user.id, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('fcm-token')
  updateFcmToken(@Body('fcmToken') token: string, @Request() req: any) {
    return this.usersService.updateFcmToken(req.user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':id/reset-password')
  @Roles(UserRole.SUPER_ADMIN)
  resetPassword(@Param('id') id: string, @Body('password') password?: string) {
    return this.usersService.resetPassword(id, password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
