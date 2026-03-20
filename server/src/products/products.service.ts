/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client'; // Fix: import from @prisma/client
import { CreateProductDto } from 'src/dto/create-product';
import { UpdateProductDto } from 'src/dto/update-product';

@Injectable()
export class ProductsService {
  constructor() {}

  private prisma = new PrismaClient();

  async create(farmerId: string, dto: CreateProductDto) {
    // Fix: Add farmerId parameter
    return this.prisma.product.create({
      data: {
        ...dto,
        farmerId: farmerId, // Fix: Add farmer relation
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        // Optional: include farmer info if needed
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        // Optional: include farmer info
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Ensure it exists
    return this.prisma.product.update({
      where: { id },
      data: dto, // dto now includes category field
    });
  }

  async remove(id: string) {
    // First, check if the product has any order items
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orders: true, // Include related order items
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If there are order items, don't allow deletion
    if (product.orders && product.orders.length > 0) {
      throw new BadRequestException(
        `Cannot delete product with ID ${id} because it has ${product.orders.length} existing order(s). Please ensure no orders are associated with this product before deleting.`,
      );
    }

    // If no order items, proceed with deletion
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // Optional: Add method to get products by farmer
  async findByFarmer(farmerId: string) {
    return this.prisma.product.findMany({
      where: { farmerId },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
