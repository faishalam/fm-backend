import { Exclude } from 'class-transformer';

export class UserEntity {
  id: string; // <-- FIXED
  email: string;
  name: string;
  salaryMonthly: number | null;
  currentSavings: number | null;
  targetAmount: number;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
