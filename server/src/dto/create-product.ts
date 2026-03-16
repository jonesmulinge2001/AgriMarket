/* eslint-disable prettier/prettier */
export class CreateProductDto {
  name: string;
  description?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  category?: string; 
}
