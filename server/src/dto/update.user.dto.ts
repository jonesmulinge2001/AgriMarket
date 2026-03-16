/* eslint-disable prettier/prettier */
import { PartialType } from '@nestjs/mapped-types';
import { RegisterUserDto } from './registerUser.dto';

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class UpdateUserDto extends PartialType(RegisterUserDto) {}
