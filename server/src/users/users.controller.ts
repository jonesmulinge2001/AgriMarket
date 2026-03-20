/* eslint-disable prettier/prettier */

/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequirePermissions } from 'src/decorator/permissions.decorator';

import { Permission } from 'src/permissions/permission.enum';
import { UsersService } from './users.service';

@Controller('admin/users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async getUsers() {
    return this.userService.getAllUsers();
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<any>) {
    return this.userService.updateUser(id, updateData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'))
  @RequirePermissions(Permission.MANAGE_USERS)
  async deleteUsers(@Body('ids') ids: string[]) {
    return this.userService.deleteUsers(ids);
  }
}
