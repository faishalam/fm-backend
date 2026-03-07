import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeProfile = { financialProfile: true };

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: this.includeProfile,
    });
    return users.map((user) => new UserEntity(user));
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.includeProfile,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserEntity(user);
  }

  async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.includeProfile,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new UserEntity(user);
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.includeProfile,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.user.delete({ where: { id: userId } });

    return null;
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.includeProfile,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      include: this.includeProfile,
    });

    return new UserEntity(updatedUser);
  }
}
