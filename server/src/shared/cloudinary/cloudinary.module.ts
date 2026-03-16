/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AcademeetCloudinaryService } from './cloudinary.service';

@Module({
  imports: [ConfigModule],
  providers: [AcademeetCloudinaryService],
  exports: [AcademeetCloudinaryService],
})
export class CloudinaryModule {}
