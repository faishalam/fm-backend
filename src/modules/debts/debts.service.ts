import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';
import { CreateDebtPaymentDto } from './dto/create-debt-payment.dto';
import { DebtEntity } from './entities/debt.entity';
import { DebtPaymentEntity } from './entities/debt-payment.entity';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includePayments = { payments: true };

  private async getProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }
    return profile.id;
  }

  private async verifyOwnership(debtId: string, userId: string) {
    const debt = await this.prisma.debt.findUnique({
      where: { id: debtId },
      include: { financialProfile: true, payments: true },
    });

    if (!debt || debt.financialProfile.userId !== userId) {
      throw new NotFoundException('Debt not found');
    }

    return debt;
  }

  async create(userId: string, dto: CreateDebtDto) {
    const profileId = await this.getProfileId(userId);

    const debt = await this.prisma.debt.create({
      data: {
        financialProfileId: profileId,
        name: dto.name,
        totalAmount: dto.totalAmount,
        interestRate: dto.interestRate,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: this.includePayments,
    });

    return new DebtEntity(debt as Record<string, unknown>);
  }

  async findAll(userId: string) {
    const profileId = await this.getProfileId(userId);

    const debts = await this.prisma.debt.findMany({
      where: { financialProfileId: profileId },
      include: this.includePayments,
      orderBy: { createdAt: 'desc' },
    });

    return debts.map((d) => new DebtEntity(d as Record<string, unknown>));
  }

  async findOne(userId: string, id: string) {
    const debt = await this.verifyOwnership(id, userId);
    return new DebtEntity(debt as Record<string, unknown>);
  }

  async update(userId: string, id: string, dto: UpdateDebtDto) {
    await this.verifyOwnership(id, userId);

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.totalAmount !== undefined) data.totalAmount = dto.totalAmount;
    if (dto.interestRate !== undefined) data.interestRate = dto.interestRate;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);

    const updated = await this.prisma.debt.update({
      where: { id },
      data,
      include: this.includePayments,
    });

    return new DebtEntity(updated as Record<string, unknown>);
  }

  async remove(userId: string, id: string) {
    await this.verifyOwnership(id, userId);

    // Delete payments first, then debt
    await this.prisma.debtPayment.deleteMany({ where: { debtId: id } });
    await this.prisma.debt.delete({ where: { id } });

    return null;
  }

  // ─── Debt Payments ─────────────────────────────────────────────────────

  async createPayment(
    userId: string,
    debtId: string,
    dto: CreateDebtPaymentDto,
  ) {
    await this.verifyOwnership(debtId, userId);

    // Find or create a system "Bayar Hutang" category
    let category = await this.prisma.category.findFirst({
      where: { userId, name: 'Bayar Hutang', type: 'EXPENSE' },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: {
          userId,
          name: 'Bayar Hutang',
          type: 'EXPENSE',
          isSystem: true,
        },
      });
    }

    const paymentDate = dto.paymentDate
      ? new Date(dto.paymentDate)
      : new Date();

    // Create transaction + debt payment in a single db transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          categoryId: category.id,
          type: 'EXPENSE',
          amount: dto.amount,
          note: dto.note ?? `Pembayaran hutang`,
          transactionDate: paymentDate,
        },
      });

      const payment = await tx.debtPayment.create({
        data: {
          debtId,
          transactionId: transaction.id,
          amount: dto.amount,
          paymentDate,
          note: dto.note,
        },
      });

      return payment;
    });

    return new DebtPaymentEntity(result as Record<string, unknown>);
  }

  async findPayments(userId: string, debtId: string) {
    await this.verifyOwnership(debtId, userId);

    const payments = await this.prisma.debtPayment.findMany({
      where: { debtId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(
      (p) => new DebtPaymentEntity(p as Record<string, unknown>),
    );
  }
}
