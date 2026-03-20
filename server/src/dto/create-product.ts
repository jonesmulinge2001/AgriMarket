// dto/create-product.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @Transform(({ value }) => {
    // Convert string to number
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
  price: number;

  @IsNotEmpty()
  @Transform(({ value }) => {
    // Convert string to number
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
  quantity: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}