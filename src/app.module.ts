import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FinancialProfilesModule } from './modules/financial-profiles/financial-profile.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, FinancialProfilesModule],
})
export class AppModule {}
