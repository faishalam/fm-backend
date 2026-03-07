import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { FinancialProfilesService } from './financial-profile.service';
import { FinancialProfileDto } from './dto/create-financial-profile.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('financial-profiles')
@UseGuards(JwtAuthGuard)
export class FinancialProfilesController {
  constructor(
    private readonly financialProfilesService: FinancialProfilesService,
  ) {}

  @Get('me')
  findByToken(@CurrentUser() user: { id: string }) {
    return this.financialProfilesService.findByToken(user.id);
  }

  @Put()
  update(
    @CurrentUser() user: { id: string },
    @Body() dto: FinancialProfileDto,
  ) {
    return this.financialProfilesService.update(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':userId')
  findByUserId(@Param('userId') userId: string) {
    return this.financialProfilesService.findByUserId(userId);
  }
}
