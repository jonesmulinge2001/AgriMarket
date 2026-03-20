/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { MailerService } from 'src/shared/mailer/mailer.service';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  constructor(private readonly mailerService: MailerService) {}

  // Get all users (with stats)
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return users.map((user) => ({
      ...user,
    }));
  }

  // Get user by ID
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        posts: { select: { id: true } },
        followers: { select: { id: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
    };
  }

  //  Update user (safe)
  async updateUser(id: string, updateData: Partial<any>) {
    const userExists = await this.prisma.user.findUnique({ where: { id } });
    if (!userExists) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        profile: {
          select: {
            profileImage: true,
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  //  Delete user
  async deleteUser(id: string) {
    const userExists = await this.prisma.user.findUnique({ where: { id } });
    if (!userExists) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully' };
  }

  async deleteUsers(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No user IDs provided');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (users.length === 0) {
      throw new NotFoundException('No users found with the given IDs');
    }

    await this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    return { message: `${users.length} user(s) deleted successfully` };
  }
}
