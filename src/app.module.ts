import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { FinancialProfilesModule } from './modules/financial-profiles/financial-profile.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DebtsModule } from './modules/debts/debts.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    FinancialProfilesModule,
    CategoriesModule,
    TransactionsModule,
    DashboardModule,
    DebtsModule,
    InvestmentsModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}
