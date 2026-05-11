import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { PdfService } from './pdf.service';

@Global()
@Module({
  providers: [StorageService, PdfService],
  exports: [StorageService, PdfService],
})
export class StorageModule {}
