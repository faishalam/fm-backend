export class SubscriptionEntity {
  id: string;
  userId: string;
  plan: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
  }
}
