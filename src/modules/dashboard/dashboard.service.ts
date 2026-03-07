import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: { gte: startDate, lte: endDate },
      },
      include: { category: true },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvestment = 0;

    const categoryBreakdown: Record<
      string,
      { name: string; type: string; total: number }
    > = {};

    for (const t of transactions) {
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        totalIncome += amount;
      } else if (t.type === 'EXPENSE') {
        totalExpense += amount;
      } else if (t.type === 'INVESTMENT') {
        totalInvestment += amount;
      }

      if (!categoryBreakdown[t.categoryId]) {
        categoryBreakdown[t.categoryId] = {
          name: t.category.name,
          type: t.category.type,
          total: 0,
        };
      }
      categoryBreakdown[t.categoryId].total += amount;
    }

    const netSaving = totalIncome - totalExpense - totalInvestment;
    const savingsRate = totalIncome > 0 ? (netSaving / totalIncome) * 100 : 0;

    let savingsRateLabel = 'N/A';
    if (totalIncome > 0) {
      if (savingsRate >= 60) savingsRateLabel = 'Aggressive';
      else if (savingsRate >= 40) savingsRateLabel = 'Strong';
      else if (savingsRate >= 20) savingsRateLabel = 'Average';
      else if (savingsRate >= 10) savingsRateLabel = 'Poor';
      else savingsRateLabel = 'Critical';
    }

    return {
      year,
      month,
      totalIncome,
      totalExpense,
      totalInvestment,
      netSaving,
      savingsRate: Math.round(savingsRate * 100) / 100,
      savingsRateLabel,
      transactionCount: transactions.length,
      categoryBreakdown: Object.values(categoryBreakdown).sort(
        (a, b) => b.total - a.total,
      ),
    };
  }

  async getForecast(userId: string) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: { gte: threeMonthsAgo },
      },
    });

    const monthlyData: Record<
      string,
      { income: number; expense: number; investment: number }
    > = {};

    for (const t of transactions) {
      const date = new Date(t.transactionDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expense: 0, investment: 0 };
      }
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        monthlyData[key].income += amount;
      } else if (t.type === 'EXPENSE') {
        monthlyData[key].expense += amount;
      } else if (t.type === 'INVESTMENT') {
        monthlyData[key].investment += amount;
      }
    }

    const months = Object.values(monthlyData);
    const monthCount = months.length || 1;

    const avgMonthlyIncome =
      months.reduce((sum, m) => sum + m.income, 0) / monthCount;
    const avgMonthlyExpense =
      months.reduce((sum, m) => sum + m.expense, 0) / monthCount;
    const avgMonthlyInvestment =
      months.reduce((sum, m) => sum + m.investment, 0) / monthCount;
    const avgMonthlySaving =
      avgMonthlyIncome - avgMonthlyExpense - avgMonthlyInvestment;

    const currentSavings = Number(profile.currentSavings ?? 0);
    const targetAmount = Number(profile.targetAmount ?? 1_000_000_000);
    const remaining = targetAmount - currentSavings;

    let estimatedMonths: number | null = null;
    if (avgMonthlySaving > 0) {
      estimatedMonths = Math.ceil(remaining / avgMonthlySaving);
    }

    const progress =
      targetAmount > 0
        ? Math.round((currentSavings / targetAmount) * 10000) / 100
        : 0;

    // Milestones
    const milestones = [
      10_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000,
      750_000_000, 1_000_000_000,
    ];

    const milestoneProgress = milestones.map((milestone) => ({
      target: milestone,
      reached: currentSavings >= milestone,
      progress:
        Math.round(Math.min((currentSavings / milestone) * 100, 100) * 100) /
        100,
    }));

    return {
      currentSavings,
      targetAmount,
      remaining: Math.max(remaining, 0),
      progress,
      avgMonthlyIncome: Math.round(avgMonthlyIncome),
      avgMonthlyExpense: Math.round(avgMonthlyExpense),
      avgMonthlySaving: Math.round(avgMonthlySaving),
      estimatedMonths,
      milestones: milestoneProgress,
    };
  }

  async getOverview(userId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const currentMonth = await this.getMonthlySummary(userId, year, month);

    // Previous month comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previousMonth = await this.getMonthlySummary(
      userId,
      prevYear,
      prevMonth,
    );

    const incomeChange =
      previousMonth.totalIncome > 0
        ? Math.round(
            ((currentMonth.totalIncome - previousMonth.totalIncome) /
              previousMonth.totalIncome) *
              10000,
          ) / 100
        : 0;

    const expenseChange =
      previousMonth.totalExpense > 0
        ? Math.round(
            ((currentMonth.totalExpense - previousMonth.totalExpense) /
              previousMonth.totalExpense) *
              10000,
          ) / 100
        : 0;

    // Alerts
    const alerts: string[] = [];

    if (currentMonth.netSaving < 0) {
      alerts.push(
        `Kamu defisit ${Math.abs(currentMonth.netSaving).toLocaleString('id-ID')} bulan ini.`,
      );
    }

    if (expenseChange > 30) {
      alerts.push(`Pengeluaran naik ${expenseChange}% dibanding bulan lalu.`);
    }

    if (currentMonth.savingsRate < 10 && currentMonth.totalIncome > 0) {
      alerts.push(
        `Savings rate kamu hanya ${currentMonth.savingsRate}%. Targetkan minimal 20%.`,
      );
    }

    return {
      currentMonth,
      comparison: {
        incomeChange,
        expenseChange,
      },
      alerts,
    };
  }

  async getWhatIfSimulation(userId: string, additionalMonthlySaving: number) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        transactionDate: { gte: threeMonthsAgo },
      },
    });

    const monthlyData: Record<
      string,
      { income: number; expense: number; investment: number }
    > = {};

    for (const t of transactions) {
      const date = new Date(t.transactionDate);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { income: 0, expense: 0, investment: 0 };
      }
      const amount = Number(t.amount);
      if (t.type === 'INCOME') {
        monthlyData[key].income += amount;
      } else if (t.type === 'EXPENSE') {
        monthlyData[key].expense += amount;
      } else if (t.type === 'INVESTMENT') {
        monthlyData[key].investment += amount;
      }
    }

    const months = Object.values(monthlyData);
    const monthCount = months.length || 1;
    const avgMonthlySaving =
      months.reduce(
        (sum, m) => sum + (m.income - m.expense - m.investment),
        0,
      ) / monthCount;

    const currentSavings = Number(profile.currentSavings ?? 0);
    const targetAmount = Number(profile.targetAmount ?? 1_000_000_000);
    const remaining = targetAmount - currentSavings;

    const currentEstimate =
      avgMonthlySaving > 0 ? Math.ceil(remaining / avgMonthlySaving) : null;

    const newMonthlySaving = avgMonthlySaving + additionalMonthlySaving;
    const newEstimate =
      newMonthlySaving > 0 ? Math.ceil(remaining / newMonthlySaving) : null;

    const monthsSaved =
      currentEstimate && newEstimate ? currentEstimate - newEstimate : null;

    return {
      currentAvgMonthlySaving: Math.round(avgMonthlySaving),
      additionalMonthlySaving,
      newMonthlySaving: Math.round(newMonthlySaving),
      currentEstimateMonths: currentEstimate,
      newEstimateMonths: newEstimate,
      monthsSaved,
    };
  }

  // ─── Net Worth ──────────────────────────────────────────────────────

  async getNetWorth(userId: string) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
      include: {
        debts: { include: { payments: true } },
        investments: {
          include: {
            investmentTransactions: true,
            assetPrices: { orderBy: { recordedAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }

    // Assets
    const currentSavings = Number(profile.currentSavings ?? 0);

    let totalInvestmentValue = 0;
    const investmentDetails = profile.investments.map((inv) => {
      const totalUnits = inv.investmentTransactions.reduce((sum, t) => {
        const unit = Number(t.unit);
        return t.type === 'BUY' ? sum + unit : sum - unit;
      }, 0);

      const latestPrice =
        inv.assetPrices.length > 0 ? Number(inv.assetPrices[0].price) : 0;
      const currentValue = totalUnits * latestPrice;
      totalInvestmentValue += currentValue;

      return {
        name: inv.name,
        type: inv.type,
        totalUnits,
        latestPrice,
        currentValue: Math.round(currentValue),
      };
    });

    const totalAssets = currentSavings + totalInvestmentValue;

    // Liabilities
    let totalLiabilities = 0;
    const debtDetails = profile.debts.map((debt) => {
      const totalPaid = debt.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const remaining = Number(debt.totalAmount) - totalPaid;
      totalLiabilities += remaining;

      return {
        name: debt.name,
        totalAmount: Number(debt.totalAmount),
        totalPaid,
        remaining: Math.max(remaining, 0),
      };
    });

    const netWorth = totalAssets - totalLiabilities;

    // Milestones
    const milestones = [
      10_000_000, 50_000_000, 100_000_000, 250_000_000, 500_000_000,
      750_000_000, 1_000_000_000,
    ];

    const milestoneProgress = milestones.map((milestone) => ({
      target: milestone,
      reached: netWorth >= milestone,
      progress:
        Math.round(Math.min((netWorth / milestone) * 100, 100) * 100) / 100,
    }));

    return {
      totalAssets: Math.round(totalAssets),
      currentSavings,
      totalInvestmentValue: Math.round(totalInvestmentValue),
      totalLiabilities: Math.round(totalLiabilities),
      netWorth: Math.round(netWorth),
      investments: investmentDetails,
      debts: debtDetails,
      milestones: milestoneProgress,
    };
  }
}
