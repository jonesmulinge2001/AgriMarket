/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prettier/prettier */
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from 'generated/prisma/client';

export class RegisterUserDto {
  @IsString({ message: 'Name must be a string.' })
  @MinLength(2, { message: 'Name must be at least 2 characters long.' })
  @MaxLength(50, { message: 'Name must be at most 50 characters long.' })
  @IsNotEmpty({ message: 'Full name is required.' })
  @Transform(({ value }) => value.trim())
  name: string;

  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @Transform(({ value }) => value.trim())
  email: string;

  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  @IsNotEmpty({ message: 'Phone number is required.' })
  @IsPhoneNumber('KE', { message: 'Phone number must be valid and Kenyan format (e.g., +2547...).' })
  @Transform(({ value }) => value.trim())
  phone: string;

  @IsNotEmpty({ message: 'Role is required.' })
  @IsEnum(UserRole, {
    message: `Role must be one of the following: ${Object.values(UserRole).join(', ')}`,
  })
  @Transform(({ value }) => value.trim())
  role?: UserRole;
}
