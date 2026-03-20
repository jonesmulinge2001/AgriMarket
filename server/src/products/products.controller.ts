/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';


import { RequestWithUser } from 'src/interfaces/requestWithUser';
import { AcademeetCloudinaryService, AcademeetUploadType } from 'src/shared/cloudinary/cloudinary.service';
import { CreateProductDto } from 'src/dto/create-product';
import { UpdateProductDto } from 'src/dto/update-product';
import { JwtAuthGuard } from 'src/guards/jwt/jwtAuth.guard';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: AcademeetCloudinaryService,
  ) {}
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateProductDto,
    @Req() req: RequestWithUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // If file is uploaded, use it
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadMedia(
        file,
        AcademeetUploadType.POST_IMAGE,
      );
      dto.imageUrl = uploadResult.secure_url;
    } 
    // If no file, check if imageUrl is provided
    else if (!dto.imageUrl) {
      throw new BadRequestException('Either product image file or imageUrl is required');
    }
  
    return this.productsService.create(req.user.id, dto);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // If image is provided, upload and replace
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadMedia(
        file,
        AcademeetUploadType.POST_IMAGE,
      );
      dto.imageUrl = uploadResult.secure_url;
    }

    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
