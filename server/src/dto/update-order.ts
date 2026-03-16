/* eslint-disable prettier/prettier */
import { OrderStatus } from "generated/prisma/client";


export class UpdateOrderDto {
  status?: OrderStatus;
  quantity?: number;
}   