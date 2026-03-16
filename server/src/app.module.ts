/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtModule } from './guards/jwt/jwt.module';
import { PermissionModule } from './permissions/permission.module';
import { CloudinaryModule } from './shared/cloudinary/cloudinary.module';
import { MailerModule } from './shared/mailer/mailer.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [CloudinaryModule, PermissionModule, JwtModule, MailerModule, AuthModule, ProductsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
