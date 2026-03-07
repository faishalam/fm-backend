import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateSubscriptionDto,
  SubscriptionPlan,
} from './dto/create-subscription.dto';
import { SubscriptionEntity } from './entities/subscription.entity';
import { PaymentEntity } from './entities/payment.entity';
import type { MidtransNotification } from './midtrans.service';
import { MidtransService } from './midtrans.service';

// ─── Plan Configuration ────────────────────────────────────────────────────

const PLAN_CONFIG: Record<
  SubscriptionPlan,
  { price: number; durationMonths: number; label: string }
> = {
  [SubscriptionPlan.THREE_MONTHS]: {
    price: 55_000,
    durationMonths: 3,
    label: '3 Bulan',
  },
  [SubscriptionPlan.SIX_MONTHS]: {
    price: 95_000,
    durationMonths: 6,
    label: '6 Bulan',
  },
  [SubscriptionPlan.ONE_YEAR]: {
    price: 160_000,
    durationMonths: 12,
    label: '1 Tahun',
  },
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly midtrans: MidtransService,
  ) {}

  // ─── Plans ──────────────────────────────────────────────────────────

  getPlans() {
    return Object.entries(PLAN_CONFIG).map(([key, config]) => ({
      plan: key,
      label: config.label,
      price: config.price,
      durationMonths: config.durationMonths,
      currency: 'IDR',
    }));
  }

  // ─── Subscribe ──────────────────────────────────────────────────────

  async subscribe(userId: string, dto: CreateSubscriptionDto) {
    const planConfig = PLAN_CONFIG[dto.plan];
    if (!planConfig) {
      throw new BadRequestException('Invalid subscription plan');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check for existing active subscription
    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (
      existing &&
      existing.status === 'ACTIVE' &&
      existing.endDate &&
      existing.endDate > new Date()
    ) {
      throw new ConflictException(
        'Kamu sudah memiliki subscription aktif. Tunggu hingga berakhir atau hubungi support.',
      );
    }

    // Check for pending payment
    const pendingPayment = await this.prisma.payment.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (pendingPayment) {
      throw new ConflictException(
        'Kamu masih memiliki pembayaran yang belum diselesaikan. Selesaikan atau batalkan terlebih dahulu.',
      );
    }

    // Create or update subscription (PENDING until paid)
    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { userId },
          data: { plan: dto.plan, status: 'EXPIRED' },
        })
      : await this.prisma.subscription.create({
          data: {
            userId,
            plan: dto.plan,
            status: 'EXPIRED', // Will become ACTIVE after payment confirmed
          },
        });

    // Generate unique Midtrans order ID
    const orderId = `FM-${uuidv4().split('-')[0].toUpperCase()}`;

    // Create real QRIS charge via Midtrans
    const charge = await this.midtrans.createQrisCharge(
      orderId,
      planConfig.price,
      user.email,
      user.username,
    );

    const expiredAt = charge.expiry_time
      ? new Date(charge.expiry_time.replace(' ', 'T'))
      : (() => {
          const d = new Date();
          d.setMinutes(d.getMinutes() + 30);
          return d;
        })();

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        externalId: orderId,
        amount: planConfig.price,
        currency: 'IDR',
        provider: 'Midtrans',
        paymentMethod: 'QRIS',
        status: 'PENDING',
        qrUrl: charge.qr_url ?? null,
        expiredAt,
      },
    });

    return {
      subscription: new SubscriptionEntity(
        subscription as unknown as Record<string, unknown>,
      ),
      payment: new PaymentEntity(payment as unknown as Record<string, unknown>),
      qris: {
        qrUrl: charge.qr_url,
        qrString: charge.qr_string,
        orderId,
        amount: planConfig.price,
        expiredAt,
        instructions: `Scan QR code dengan aplikasi QRIS (GoPay, OVO, Dana, ShopeePay, m-Banking). QR berlaku hingga ${expiredAt.toLocaleString('id-ID')}.`,
      },
    };
  }

  // ─── Midtrans Webhook Handler ─────────────────────────────────────────

  async handleWebhook(notification: MidtransNotification) {
    if (!this.midtrans.verifySignature(notification)) {
      this.logger.warn(
        `Invalid Midtrans signature for order: ${notification.order_id}`,
      );
      throw new BadRequestException('Invalid signature');
    }

    const { order_id, transaction_status } = notification;
    this.logger.log(`Midtrans webhook: ${order_id} -> ${transaction_status}`);

    const payment = await this.prisma.payment.findFirst({
      where: { externalId: order_id },
      include: { subscription: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for orderId: ${order_id}`);
      return { status: 'ignored', reason: 'payment not found' };
    }

    if (this.midtrans.isPaymentSettled(notification)) {
      if (payment.status === 'PAID') return { status: 'already_processed' };
      await this.activateSubscription(payment.id, payment.subscriptionId!);
      this.logger.log(`Subscription activated via webhook: ${order_id}`);
      return { status: 'ok', order_id };
    }

    if (['expire', 'cancel', 'deny'].includes(transaction_status)) {
      if (payment.status === 'PENDING') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'EXPIRED' },
        });
      }
      return { status: 'ok', order_id };
    }

    return { status: 'ignored', transaction_status };
  }

  // ─── Internal: Activate Subscription ─────────────────────────────────

  private async activateSubscription(
    paymentId: string,
    subscriptionId: string,
  ) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });
    if (!sub) throw new NotFoundException('Subscription not found');

    const planConfig = PLAN_CONFIG[sub.plan];
    if (!planConfig)
      throw new BadRequestException('Invalid plan on subscription');

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + planConfig.durationMonths);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'PAID', paidAt: now },
      });
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { status: 'ACTIVE', startDate: now, endDate },
      });
    });
  }

  // ─── Get My Subscription ───────────────────────────────────────────

  async getMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    if (!subscription) {
      return {
        hasSubscription: false,
        subscription: null,
        plans: this.getPlans(),
      };
    }

    const isActive =
      subscription.status === 'ACTIVE' &&
      subscription.endDate != null &&
      subscription.endDate > new Date();

    const planConfig = PLAN_CONFIG[subscription.plan];

    return {
      hasSubscription: isActive,
      subscription: {
        ...new SubscriptionEntity(
          subscription as unknown as Record<string, unknown>,
        ),
        isActive,
        planLabel: planConfig?.label ?? subscription.plan,
        daysRemaining:
          isActive && subscription.endDate
            ? Math.ceil(
                (subscription.endDate.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              )
            : 0,
      },
      recentPayments: subscription.payments.map(
        (p) => new PaymentEntity(p as unknown as Record<string, unknown>),
      ),
    };
  }

  // ─── Admin: Confirm Payment Manually ─────────────────────────────────

  async confirmPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException(
        `Payment sudah berstatus ${payment.status}.`,
      );
    }
    if (!payment.subscriptionId) {
      throw new BadRequestException(
        'Payment tidak terkait dengan subscription',
      );
    }

    await this.activateSubscription(payment.id, payment.subscriptionId);

    const updated = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });

    const planConfig =
      PLAN_CONFIG[updated?.subscription?.plan as SubscriptionPlan];

    return {
      payment: new PaymentEntity(updated as unknown as Record<string, unknown>),
      subscription: new SubscriptionEntity(
        updated?.subscription as unknown as Record<string, unknown>,
      ),
      message: `Subscription ${planConfig?.label ?? ''} aktif sampai ${updated?.subscription?.endDate?.toLocaleDateString('id-ID')}.`,
    };
  }

  // ─── Cancel Payment ────────────────────────────────────────────────

  async cancelPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new BadRequestException(
        `Payment sudah berstatus ${payment.status}. Tidak bisa dibatalkan.`,
      );
    }

    // Also cancel on Midtrans (non-blocking — don't fail local cancel if Midtrans errors)
    if (payment.externalId) {
      try {
        await this.midtrans.cancelTransaction(payment.externalId);
      } catch (err) {
        this.logger.warn(
          `Midtrans cancel failed for ${payment.externalId}: ${err}`,
        );
      }
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });

    return new PaymentEntity(updated as unknown as Record<string, unknown>);
  }

  // ─── Payment History ───────────────────────────────────────────────

  async getPaymentHistory(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map(
      (p) => new PaymentEntity(p as unknown as Record<string, unknown>),
    );
  }

  // ─── Admin: List All Payments ──────────────────────────────────────

  async getAllPayments(status?: string) {
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: { user: { select: { id: true, email: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      ...new PaymentEntity(p as unknown as Record<string, unknown>),
      user: p.user,
    }));
  }
}
