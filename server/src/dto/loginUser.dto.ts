/* eslint-disable prettier/prettier */
import { IsString } from 'class-validator';

/* eslint-disable prettier/prettier */
export class LoginUserDto {
    @IsString()
    email: string;
    
    @IsString()
    password: string;
  }
  