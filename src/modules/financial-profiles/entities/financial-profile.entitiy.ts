export class FinancialProfileEntity {
  id: string;
  userId: string;
  salaryMonthly: number | null;
  currentSavings: number | null;
  targetAmount: number | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Record<string, unknown>) {
    this.id = partial.id as string;
    this.userId = partial.userId as string;
    this.salaryMonthly =
      partial.salaryMonthly != null ? Number(partial.salaryMonthly) : null;
    this.currentSavings =
      partial.currentSavings != null ? Number(partial.currentSavings) : null;
    this.targetAmount =
      partial.targetAmount != null ? Number(partial.targetAmount) : null;
    this.createdAt = partial.createdAt as Date;
    this.updatedAt = partial.updatedAt as Date;
  }
}
