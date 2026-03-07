import { Exclude } from 'class-transformer';
import { FinancialProfileEntity } from '../../financial-profiles/entities/financial-profile.entitiy';

export class UserEntity {
  id: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string;

  @Exclude()
  deletedAt: Date | null;

  financialProfile?: FinancialProfileEntity | null;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
    if (partial.financialProfile) {
      this.financialProfile = new FinancialProfileEntity(
        partial.financialProfile as Record<string, unknown>,
      );
    }
  }
}
