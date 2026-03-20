/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
//  dto/update-product.dto.ts
import { IsOptional, IsString, IsNumber, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error('Price must be a valid number');
      }
      return num;
    }
    return value;
  })
  @IsNumber()
  price?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'string') {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error('Quantity must be a valid number');
      }
      return num;
    }
    return value;
  })
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}