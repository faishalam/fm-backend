import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { CreateInvestmentTransactionDto } from './dto/create-investment-transaction.dto';
import { CreateAssetPriceDto } from './dto/create-asset-price.dto';
import { InvestmentEntity } from './entities/investment.entity';
import { InvestmentTransactionEntity } from './entities/investment-transaction.entity';
import { AssetPriceEntity } from './entities/asset-price.entity';

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeAll = {
    investmentTransactions: { orderBy: { createdAt: 'desc' as const } },
    assetPrices: { orderBy: { recordedAt: 'desc' as const }, take: 1 },
  };

  private async getProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }
    return profile.id;
  }

  private async verifyOwnership(investmentId: string, userId: string) {
    const investment = await this.prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        financialProfile: true,
        investmentTransactions: { orderBy: { createdAt: 'desc' } },
        assetPrices: { orderBy: { recordedAt: 'desc' }, take: 1 },
      },
    });

    if (!investment || investment.financialProfile.userId !== userId) {
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  // ─── Investments CRUD ────────────────────────────────────────────────

  async create(userId: string, dto: CreateInvestmentDto) {
    const profileId = await this.getProfileId(userId);

    const investment = await this.prisma.investment.create({
      data: {
        financialProfileId: profileId,
        name: dto.name,
        type: dto.type,
        symbol: dto.symbol,
      },
      include: this.includeAll,
    });

    return new InvestmentEntity(investment as Record<string, unknown>);
  }

  async findAll(userId: string) {
    const profileId = await this.getProfileId(userId);

    const investments = await this.prisma.investment.findMany({
      where: { financialProfileId: profileId },
      include: this.includeAll,
      orderBy: { createdAt: 'desc' },
    });

    return investments.map(
      (i) => new InvestmentEntity(i as Record<string, unknown>),
    );
  }

  async findOne(userId: string, id: string) {
    const investment = await this.verifyOwnership(id, userId);
    return new InvestmentEntity(investment as Record<string, unknown>);
  }

  async update(userId: string, id: string, dto: UpdateInvestmentDto) {
    await this.verifyOwnership(id, userId);

    const updated = await this.prisma.investment.update({
      where: { id },
      data: dto,
      include: this.includeAll,
    });

    return new InvestmentEntity(updated as Record<string, unknown>);
  }

  async remove(userId: string, id: string) {
    await this.verifyOwnership(id, userId);

    // Delete related records first
    await this.prisma.investmentTransaction.deleteMany({
      where: { investmentId: id },
    });
    await this.prisma.assetPrice.deleteMany({
      where: { investmentId: id },
    });
    await this.prisma.investment.delete({ where: { id } });

    return null;
  }

  // ─── Investment Transactions ─────────────────────────────────────────

  async createTransaction(
    userId: string,
    investmentId: string,
    dto: CreateInvestmentTransactionDto,
  ) {
    await this.verifyOwnership(investmentId, userId);

    const totalValue = dto.unit * dto.pricePerUnit;
    const txDate = dto.transactionDate
      ? new Date(dto.transactionDate)
      : new Date();

    // Find or create an "Investasi" category
    const categoryType = dto.type === 'BUY' ? 'INVESTMENT' : 'INCOME';
    const categoryName =
      dto.type === 'BUY' ? 'Investasi' : 'Penjualan Investasi';

    let category = await this.prisma.category.findFirst({
      where: { userId, name: categoryName, type: categoryType },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: {
          userId,
          name: categoryName,
          type: categoryType,
          isSystem: true,
        },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create the general transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          categoryId: category.id,
          type: categoryType,
          amount: totalValue,
          note: dto.note ?? `${dto.type} ${dto.unit} units`,
          transactionDate: txDate,
        },
      });

      // Create the investment transaction
      const investmentTx = await tx.investmentTransaction.create({
        data: {
          investmentId,
          transactionId: transaction.id,
          type: dto.type,
          unit: dto.unit,
          pricePerUnit: dto.pricePerUnit,
          totalValue,
          transactionDate: txDate,
        },
      });

      return investmentTx;
    });

    return new InvestmentTransactionEntity(result as Record<string, unknown>);
  }

  async findTransactions(userId: string, investmentId: string) {
    await this.verifyOwnership(investmentId, userId);

    const txs = await this.prisma.investmentTransaction.findMany({
      where: { investmentId },
      orderBy: { createdAt: 'desc' },
    });

    return txs.map(
      (t) => new InvestmentTransactionEntity(t as Record<string, unknown>),
    );
  }

  // ─── Asset Prices ───────────────────────────────────────────────────

  async createAssetPrice(
    userId: string,
    investmentId: string,
    dto: CreateAssetPriceDto,
  ) {
    await this.verifyOwnership(investmentId, userId);

    const price = await this.prisma.assetPrice.create({
      data: {
        investmentId,
        price: dto.price,
      },
    });

    return new AssetPriceEntity(price as Record<string, unknown>);
  }

  async findAssetPrices(userId: string, investmentId: string) {
    await this.verifyOwnership(investmentId, userId);

    const prices = await this.prisma.assetPrice.findMany({
      where: { investmentId },
      orderBy: { recordedAt: 'desc' },
      take: 30,
    });

    return prices.map(
      (p) => new AssetPriceEntity(p as Record<string, unknown>),
    );
  }

  // ─── Portfolio Summary ──────────────────────────────────────────────

  async getPortfolioSummary(userId: string) {
    const profileId = await this.getProfileId(userId);

    const investments = await this.prisma.investment.findMany({
      where: { financialProfileId: profileId },
      include: this.includeAll,
    });

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const portfolio = investments.map((inv) => {
      const entity = new InvestmentEntity(inv as Record<string, unknown>);

      // Calculate total invested (sum of BUY - SELL totalValues)
      const invested = inv.investmentTransactions.reduce((sum, t) => {
        const val = Number(t.totalValue ?? 0);
        return t.type === 'BUY' ? sum + val : sum - val;
      }, 0);

      totalInvested += invested;
      totalCurrentValue += entity.currentValue;

      return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        symbol: entity.symbol,
        totalUnits: entity.totalUnits,
        currentValue: entity.currentValue,
        totalInvested: invested,
        profitLoss: entity.currentValue - invested,
      };
    });

    return {
      totalInvested: Math.round(totalInvested),
      totalCurrentValue: Math.round(totalCurrentValue),
      totalProfitLoss: Math.round(totalCurrentValue - totalInvested),
      investments: portfolio,
    };
  }
}
