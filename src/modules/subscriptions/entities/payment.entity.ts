export class PaymentEntity {
  id: string;
  userId: string;
  subscriptionId: string | null;
  externalId: string | null;
  amount: number;
  currency: string;
  provider: string | null;
  paymentMethod: string;
  status: string;
  qrUrl: string | null;
  expiredAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Record<string, unknown>) {
    this.id = partial.id as string;
    this.userId = partial.userId as string;
    this.subscriptionId = (partial.subscriptionId as string) ?? null;
    this.externalId = (partial.externalId as string) ?? null;
    this.amount = Number(partial.amount);
    this.currency = partial.currency as string;
    this.provider = (partial.provider as string) ?? null;
    this.paymentMethod = partial.paymentMethod as string;
    this.status = partial.status as string;
    this.qrUrl = (partial.qrUrl as string) ?? null;
    this.expiredAt = (partial.expiredAt as Date) ?? null;
    this.paidAt = (partial.paidAt as Date) ?? null;
    this.createdAt = partial.createdAt as Date;
    this.updatedAt = partial.updatedAt as Date;
  }
}
