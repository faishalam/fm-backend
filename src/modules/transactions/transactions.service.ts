import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionEntity } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeCategory = { category: true };

  async create(userId: string, dto: CreateTransactionDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException('Category not found');
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        note: dto.note,
        transactionDate: new Date(dto.transactionDate),
      },
      include: this.includeCategory,
    });

    return new TransactionEntity(transaction as Record<string, unknown>);
  }

  async findAll(
    userId: string,
    query: {
      type?: string;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { type, categoryId, startDate, endDate } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId,
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      where.transactionDate = dateFilter;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: this.includeCategory,
        orderBy: { transactionDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions.map(
        (t) => new TransactionEntity(t as Record<string, unknown>),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: this.includeCategory,
    });

    if (!transaction || transaction.userId !== userId || transaction.deletedAt) {
      throw new NotFoundException('Transaction not found');
    }

    return new TransactionEntity(transaction as Record<string, unknown>);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.userId !== userId || transaction.deletedAt) {
      throw new NotFoundException('Transaction not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category || category.userId !== userId) {
        throw new NotFoundException('Category not found');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.categoryId) data.categoryId = dto.categoryId;
    if (dto.type) data.type = dto.type;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.note !== undefined) data.note = dto.note;
    if (dto.transactionDate) data.transactionDate = new Date(dto.transactionDate);

    const updated = await this.prisma.transaction.update({
      where: { id },
      data,
      include: this.includeCategory,
    });

    return new TransactionEntity(updated as Record<string, unknown>);
  }

  async remove(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.userId !== userId || transaction.deletedAt) {
      throw new NotFoundException('Transaction not found');
    }

    await this.prisma.transaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return null;
  }
}
