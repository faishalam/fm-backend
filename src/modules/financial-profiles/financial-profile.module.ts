import { Module } from '@nestjs/common';
import { FinancialProfilesService } from './financial-profile.service';
import { FinancialProfilesController } from './financial-profile.controller';

@Module({
  providers: [FinancialProfilesService],
  controllers: [FinancialProfilesController],
})
export class FinancialProfilesModule {}
