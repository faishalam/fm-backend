import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { CreateInvestmentTransactionDto } from './dto/create-investment-transaction.dto';
import { CreateAssetPriceDto } from './dto/create-asset-price.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('investments')
@UseGuards(JwtAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // ─── Investments CRUD ────────────────────────────────────────────────

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateInvestmentDto,
  ) {
    return this.investmentsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.investmentsService.findAll(user.id);
  }

  @Get('portfolio')
  getPortfolioSummary(@CurrentUser() user: { id: string }) {
    return this.investmentsService.getPortfolioSummary(user.id);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.investmentsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.investmentsService.remove(user.id, id);
  }

  // ─── Investment Transactions ─────────────────────────────────────────

  @Post(':id/transactions')
  createTransaction(
    @CurrentUser() user: { id: string },
    @Param('id') investmentId: string,
    @Body() dto: CreateInvestmentTransactionDto,
  ) {
    return this.investmentsService.createTransaction(
      user.id,
      investmentId,
      dto,
    );
  }

  @Get(':id/transactions')
  findTransactions(
    @CurrentUser() user: { id: string },
    @Param('id') investmentId: string,
  ) {
    return this.investmentsService.findTransactions(user.id, investmentId);
  }

  // ─── Asset Prices ───────────────────────────────────────────────────

  @Post(':id/prices')
  createAssetPrice(
    @CurrentUser() user: { id: string },
    @Param('id') investmentId: string,
    @Body() dto: CreateAssetPriceDto,
  ) {
    return this.investmentsService.createAssetPrice(
      user.id,
      investmentId,
      dto,
    );
  }

  @Get(':id/prices')
  findAssetPrices(
    @CurrentUser() user: { id: string },
    @Param('id') investmentId: string,
  ) {
    return this.investmentsService.findAssetPrices(user.id, investmentId);
  }
}
