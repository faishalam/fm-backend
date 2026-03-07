import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: {
        userId_name_type: { userId, name: dto.name, type: dto.type },
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name and type already exists');
    }

    const category = await this.prisma.category.create({
      data: { userId, name: dto.name, type: dto.type },
    });

    return new CategoryEntity(category as Record<string, unknown>);
  }

  async findAll(userId: string, type?: string) {
    const where: Record<string, unknown> = { userId };
    if (type) {
      where.type = type;
    }

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return categories.map(
      (category) => new CategoryEntity(category as Record<string, unknown>),
    );
  }

  async findOne(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }

    return new CategoryEntity(category as Record<string, unknown>);
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }

    if (category.isSystem) {
      throw new ForbiddenException('Cannot update system category');
    }

    if (dto.name) {
      const existing = await this.prisma.category.findUnique({
        where: {
          userId_name_type: { userId, name: dto.name, type: category.type },
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });

    return new CategoryEntity(updated as Record<string, unknown>);
  }

  async remove(userId: string, id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }

    if (category.isSystem) {
      throw new ForbiddenException('Cannot delete system category');
    }

    const transactionCount = await this.prisma.transaction.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (transactionCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing transactions',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return null;
  }

  async seedDefaultCategories(userId: string) {
    const defaults = [
      { name: 'Gaji', type: 'INCOME' as const },
      { name: 'Freelance', type: 'INCOME' as const },
      { name: 'Bonus', type: 'INCOME' as const },
      { name: 'Lainnya', type: 'INCOME' as const },
      { name: 'Makanan', type: 'EXPENSE' as const },
      { name: 'Transportasi', type: 'EXPENSE' as const },
      { name: 'Belanja', type: 'EXPENSE' as const },
      { name: 'Hiburan', type: 'EXPENSE' as const },
      { name: 'Tagihan', type: 'EXPENSE' as const },
      { name: 'Kesehatan', type: 'EXPENSE' as const },
      { name: 'Pendidikan', type: 'EXPENSE' as const },
      { name: 'Lainnya', type: 'EXPENSE' as const },
      { name: 'Investasi', type: 'INVESTMENT' as const },
      { name: 'Penjualan Investasi', type: 'INCOME' as const },
      { name: 'Bayar Hutang', type: 'EXPENSE' as const },
    ];

    await this.prisma.category.createMany({
      data: defaults.map((c) => ({
        userId,
        name: c.name,
        type: c.type,
        isSystem: true,
      })),
    });
  }
}
