/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { Permission } from './permission.enum';
import { UserRole } from 'generated/prisma/client';

@Injectable()
export class PermissionService {
    private readonly rolePermissions: Record<UserRole, Permission[]> = {
        ADMIN: [
            Permission.VIEW_ANALYTICS,
            Permission.VIEW_USERS,
            Permission.MANAGE_EVENTS,
            Permission.MANAGE_USERS,
            Permission.MANAGE_ANNOUNCEMENTS,
            Permission.VIEW_EVENTS,
            Permission.VIEW_NOTIFICATIONS,
            Permission.VIEW_RESOURCES,
            Permission.VIEW_POSTS,
            Permission.UPLOAD_RESOURCE,
            Permission.CREATE_EVENT,
            Permission.DELETE_COMMENT,
            Permission.DELETE_POST,
            Permission.CREATE_PROFILE,
            Permission.MANAGE_PROFILE
          ],
          USER: [
            Permission.VIEW_EVENTS,
            Permission.VIEW_POSTS,
            Permission.VIEW_RESOURCES,
            Permission.VIEW_NOTIFICATIONS,
            Permission.CREATE_COMMENT,
            Permission.VIEW_COMMENT,
            Permission.EDIT_POST,
            Permission.DELETE_COMMENT,
            Permission.CREATE_POST,
            Permission.EDIT_POST,
            Permission.SUBMIT_FEEDBACK,
            Permission.LIKE_POST,
            Permission.CREATE_PROFILE,
            Permission.MANAGE_PROFILE
        ],
        FARMER: [
            Permission.CREATE_POST,
            Permission.VIEW_POSTS,
            Permission.CREATE_EVENT,
            Permission.MANAGE_PROFILE
        ]
    };

    getRolePermissions(role: UserRole): Permission[] {
        return this.rolePermissions[role] || [];
    }
    hasPermission(role: UserRole, permission: Permission): boolean {
        return this.getRolePermissions(role).includes(permission);
    }
}
