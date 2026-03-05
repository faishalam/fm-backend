import { Exclude } from 'class-transformer';

export class UserEntity {
  id: string;
  email: string;
  username: string;
  phoneNumber: string;
  avatar: string | null;
  role: string;
  isActive: boolean;
  isSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
