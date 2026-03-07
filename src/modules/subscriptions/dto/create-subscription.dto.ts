import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

export { SubscriptionPlan };

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}
