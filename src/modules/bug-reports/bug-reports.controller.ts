import { Controller, Post, Body, Get, Param, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BugReportsService } from './bug-reports.service';
import { CreateBugReportDto, UpdateBugReportStatusDto } from './dto/bug-report.dto';
import { Public } from '../../common/decorators/public.decorator';

// No global AuthGuard here because we want to allow guests on the login page to report bugs
@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('screenshot'))
  create(
    @Body() createBugReportDto: CreateBugReportDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.bugReportsService.create(createBugReportDto, file);
  }

  @Get()
  findAll() {
    return this.bugReportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bugReportsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBugReportStatusDto,
  ) {
    return this.bugReportsService.updateStatus(id, updateDto);
  }
}
