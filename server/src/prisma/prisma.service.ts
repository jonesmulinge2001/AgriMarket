/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */

import { PrismaClient } from "generated/prisma/client";

let prisma: PrismaClient;
export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'info', 'query', 'warn'],
    });
  }
  return prisma
};
