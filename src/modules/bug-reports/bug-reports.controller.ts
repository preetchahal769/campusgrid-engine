import { Controller, Post, Body, Get, Param, Patch, UseInterceptors, UploadedFile, Query, Res, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BugReportsService } from './bug-reports.service';
import { CreateBugReportDto, UpdateBugReportStatusDto } from './dto/bug-report.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

// No global AuthGuard here because we want to allow guests on the login page to report bugs
@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Public()
  @Get('proxy-image')
  async proxyImage(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).send('URL required');
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.set({
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      });
      res.send(buffer);
    } catch (error) {
      res.status(500).send('Error fetching image');
    }
  }

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('screenshot'))
  create(
    @Body() createBugReportDto: CreateBugReportDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bugReportsService.create(createBugReportDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-reports')
  findMyReports(@Request() req: AuthenticatedRequest) {
    return this.bugReportsService.findByEmail(req.user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reopen')
  reopenReport(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Request() req: AuthenticatedRequest
  ) {
    return this.bugReportsService.reopenReport(id, req.user.email, body.message);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/close')
  closeReport(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.bugReportsService.closeReport(id, req.user.email);
  }

  @Roles('SUPER_ADMIN')
  @Get()
  findAll() {
    return this.bugReportsService.findAll();
  }

  @Roles('SUPER_ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bugReportsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBugReportStatusDto,
    @Request() req: AuthenticatedRequest
  ) {
    return this.bugReportsService.updateStatus(id, updateDto, req.user.email, req.user.role);
  }
}
