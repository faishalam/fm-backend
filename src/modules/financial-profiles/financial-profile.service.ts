import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FinancialProfileDto } from './dto/create-financial-profile.dto';
import { FinancialProfileEntity } from './entities/financial-profile.entitiy';

@Injectable()
export class FinancialProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByToken(userId: string) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }

    return new FinancialProfileEntity(profile as Record<string, unknown>);
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }

    return new FinancialProfileEntity(profile as Record<string, unknown>);
  }

  async update(userId: string, dto: FinancialProfileDto) {
    const profile = await this.prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Financial profile not found');
    }

    // strip undefined/null — only update fields that were actually provided
    const data = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined && v !== null),
    );

    const updated = await this.prisma.financialProfile.update({
      where: { userId },
      data,
    });

    return new FinancialProfileEntity(updated as Record<string, unknown>);
  }
}
