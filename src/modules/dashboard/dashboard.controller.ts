import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getOverview(user.id);
  }

  @Get('summary')
  getMonthlySummary(
    @CurrentUser() user: { id: string },
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const now = new Date();
    const y = year ? parseInt(year, 10) : now.getFullYear();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    return this.dashboardService.getMonthlySummary(user.id, y, m);
  }

  @Get('forecast')
  getForecast(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getForecast(user.id);
  }

  @Get('what-if')
  getWhatIfSimulation(
    @CurrentUser() user: { id: string },
    @Query('additionalSaving') additionalSaving: string,
  ) {
    const amount = parseInt(additionalSaving, 10) || 0;
    return this.dashboardService.getWhatIfSimulation(user.id, amount);
  }

  @Get('net-worth')
  getNetWorth(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getNetWorth(user.id);
  }
}
