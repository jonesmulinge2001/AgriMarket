/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';  // Fix: import from @prisma/client
import { CreateProductDto } from 'src/dto/create-product';
import { UpdateProductDto } from 'src/dto/update-product';

@Injectable()
export class ProductsService {
  constructor() {}

  private prisma = new PrismaClient();

  async create(farmerId: string, dto: CreateProductDto) {  // Fix: Add farmerId parameter
    return this.prisma.product.create({
      data: {
        ...dto,
        farmerId: farmerId  // Fix: Add farmer relation
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {  // Optional: include farmer info if needed
        farmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ 
      where: { id },
      include: {  // Optional: include farmer info
        farmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id); // Ensure it exists
    return this.prisma.product.update({ 
      where: { id }, 
      data: dto  // dto now includes category field
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure it exists
    
    // Optional: Check if product has any orders before deleting
    const productWithOrders = await this.prisma.product.findUnique({
      where: { id },
      include: { orders: true }
    });
    
    if (productWithOrders?.orders.length) {
      // Handle case where product has orders - either prevent deletion or handle accordingly
      // For now, we'll just delete (cascade should handle orderItems)
    }
    
    return this.prisma.product.delete({ where: { id } });
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
            email: true
          }
        }
      }
    });
  }
}