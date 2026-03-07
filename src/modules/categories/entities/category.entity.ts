export class CategoryEntity {
  id: string;
  userId: string;
  name: string;
  type: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
  }
}
