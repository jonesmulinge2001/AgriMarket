/* eslint-disable prettier/prettier */
/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Order, OrderStatus, PrismaClient } from 'generated/prisma/client';  // Fix: import from @prisma/client
import { CreateOrderDto } from 'src/dto/create-order';
import { UpdateOrderDto } from 'src/dto/update-order';

@Injectable()
export class OrdersService {
  constructor() {}

  private prisma = new PrismaClient();

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (dto.quantity > product.quantity)
      throw new BadRequestException('Insufficient product stock');

    const totalPrice = dto.quantity * product.price;

    // Reduce product quantity
    await this.prisma.product.update({
      where: { id: dto.productId },
      data: { quantity: product.quantity - dto.quantity },
    });

    return this.prisma.order.create({
      data: {
        buyerId: userId,
        total: totalPrice,  // Fix: use 'total' instead of 'totalPrice'
        items: {  // Fix: Order has items relation, not direct productId/quantity
          create: {
            productId: dto.productId,
            quantity: dto.quantity,
            price: product.price
          }
        }
      },
      include: {  // Fix: Add include to get the created items
        items: {
          include: { product: true }
        }
      }
    });
  }

  findAll(): Promise<Order[]> {
    return this.prisma.order.findMany({
      include: { 
        items: {  // Fix: use 'items' instead of 'product'
          include: { product: true }
        }, 
        buyer: true  // Fix: use 'buyer' instead of 'user'
      },
    });
  }

  findOne(id: string): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: { id },
      include: { 
        items: {  // Fix: use 'items' instead of 'product'
          include: { product: true }
        }, 
        buyer: true  // Fix: use 'buyer' instead of 'user'
      },
    });
  } 

  async update(id: string, dto: UpdateOrderDto): Promise<Order> {
    const order = await this.prisma.order.findUnique({ 
      where: { id },
      include: { 
        items: {  // Fix: include items to get product info
          include: { product: true }
        }
      }
    });
    
    if (!order) throw new NotFoundException('Order not found');

    // Get the first item (assuming single item per order for now)
    const orderItem = order.items[0];
    if (!orderItem) throw new NotFoundException('Order item not found');

    if (dto.quantity) {
      const product = await this.prisma.product.findUnique({ 
        where: { id: orderItem.productId } 
      });
      
      if (!product) throw new NotFoundException('Product not found');
      if (dto.quantity > product.quantity + orderItem.quantity)
        throw new BadRequestException('Insufficient stock for update');

      // Update product stock
      await this.prisma.product.update({
        where: { id: product.id },
        data: { quantity: product.quantity + orderItem.quantity - dto.quantity },
      });

      // Update order item
      await this.prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          quantity: dto.quantity,
          price: product.price
        }
      });

      // Update order total
      const newTotal = dto.quantity * product.price;
      return this.prisma.order.update({
        where: { id },
        data: {
          total: newTotal,
          status: dto.status ?? order.status,
        },
        include: {
          items: {
            include: { product: true }
          },
          buyer: true
        }
      });
    }

    // If only status update
    return this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status ?? order.status,
      },
      include: {
        items: {
          include: { product: true }
        },
        buyer: true
      }
    });
  }

  async remove(id: string): Promise<Order> {
    const order = await this.prisma.order.findUnique({ 
      where: { id },
      include: { 
        items: {  // Fix: include items to restore product quantity
          include: { product: true }
        }
      }
    });
    
    if (!order) throw new NotFoundException('Order not found');

    // Restore product quantity for each item
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    // Delete order items first (cascade should handle this, but being explicit)
    await this.prisma.orderItem.deleteMany({
      where: { orderId: id }
    });

    return this.prisma.order.delete({ 
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        buyer: true
      }
    });
  }


  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.prisma.order.findUnique({ 
      where: { id },
      include: { items: true }
    });
    
    if (!order) throw new NotFoundException('Order not found');
    
    // Only update status, don't touch quantity or stock
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { product: true }
        },
        buyer: true
      }
    });
  }

}