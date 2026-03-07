import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import type { MidtransNotification } from './midtrans.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── Public: Midtrans Webhook ───────────────────────────────────────

  @Post('webhook')
  handleWebhook(@Body() notification: MidtransNotification) {
    return this.subscriptionsService.handleWebhook(notification);
  }

  // ─── Public: Get available plans ──────────────────────────────────

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  // ─── User: Subscribe to a plan ────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post()
  subscribe(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.subscribe(user.id, dto);
  }

  // ─── User: Get my subscription ────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMySubscription(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  // ─── User: Cancel a pending payment ───────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('payments/:paymentId/cancel')
  cancelPayment(
    @CurrentUser() user: { id: string },
    @Param('paymentId') paymentId: string,
  ) {
    return this.subscriptionsService.cancelPayment(user.id, paymentId);
  }

  // ─── User: Payment history ────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('payments')
  getPaymentHistory(@CurrentUser() user: { id: string }) {
    return this.subscriptionsService.getPaymentHistory(user.id);
  }

  // ─── Admin: Confirm payment ───────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('payments/:paymentId/confirm')
  confirmPayment(@Param('paymentId') paymentId: string) {
    return this.subscriptionsService.confirmPayment(paymentId);
  }

  // ─── Admin: List all payments ─────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/payments')
  getAllPayments(@Query('status') status?: string) {
    return this.subscriptionsService.getAllPayments(status);
  }
}
