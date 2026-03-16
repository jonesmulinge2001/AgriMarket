import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { CloudinaryModule } from 'src/shared/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}
