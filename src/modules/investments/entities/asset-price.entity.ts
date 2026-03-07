export class AssetPriceEntity {
  id: string;
  investmentId: string;
  price: number;
  recordedAt: Date;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
    this.price = partial.price != null ? Number(partial.price) : 0;
  }
}
