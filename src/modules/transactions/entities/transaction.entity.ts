import { Exclude } from 'class-transformer';
import { CategoryEntity } from '../../categories/entities/category.entity';

export class TransactionEntity {
  id: string;
  userId: string;
  categoryId: string;
  type: string;
  amount: number;
  note: string | null;
  transactionDate: Date;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;

  category?: CategoryEntity;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
    this.amount = partial.amount != null ? Number(partial.amount) : 0;

    if (partial.category) {
      this.category = new CategoryEntity(
        partial.category as Record<string, unknown>,
      );
    }
  }
}
