import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

export interface MidtransChargeResponse {
  transaction_id: string;
  order_id: string;
  status_code: string;
  transaction_status: string;
  gross_amount: string;
  qr_string: string;
  qr_url: string;
  expiry_time: string;
}

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  transaction_status: string;
  fraud_status?: string;
  signature_key: string;
  payment_type?: string;
  transaction_id?: string;
}

@Injectable()
export class MidtransService {
  private readonly logger = new Logger(MidtransService.name);

  private get serverKey(): string {
    return process.env.MIDTRANS_SERVER_KEY ?? '';
  }

  private get isProduction(): boolean {
    return process.env.MIDTRANS_IS_PRODUCTION === 'true';
  }

  private get baseUrl(): string {
    return this.isProduction
      ? 'https://api.midtrans.com/v2'
      : 'https://api.sandbox.midtrans.com/v2';
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`${this.serverKey}:`).toString('base64')}`;
  }

  // ─── Create QRIS Charge ────────────────────────────────────────────

  async createQrisCharge(
    orderId: string,
    amount: number,
    customerEmail: string,
    customerName: string,
  ): Promise<MidtransChargeResponse> {
    if (!this.serverKey) {
      throw new BadRequestException(
        'MIDTRANS_SERVER_KEY belum dikonfigurasi di environment.',
      );
    }

    const payload = {
      payment_type: 'qris',
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        email: customerEmail,
        first_name: customerName,
      },
      qris: {
        acquirer: 'gopay',
      },
    };

    try {
      const response = await axios.post<MidtransChargeResponse>(
        `${this.baseUrl}/charge`,
        payload,
        {
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;

      // Extract QR image URL from actions array if present
      const actions = (
        data as unknown as { actions?: { name: string; url: string }[] }
      ).actions;
      if (actions?.length) {
        const qrAction = actions.find((a) => a.name === 'generate-qr-code');
        if (qrAction) data.qr_url = qrAction.url;
      }

      this.logger.log(
        `QRIS charge created: orderId=${orderId}, status=${data.transaction_status}`,
      );
      return data;
    } catch (err) {
      const errorData = (err as { response?: { data?: unknown } }).response
        ?.data;
      this.logger.error(`Midtrans charge failed: ${JSON.stringify(errorData)}`);
      throw new BadRequestException(
        `Gagal membuat QRIS: ${JSON.stringify(errorData) ?? 'Midtrans error'}`,
      );
    }
  }

  // ─── Cancel Transaction ────────────────────────────────────────────

  async cancelTransaction(orderId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/${orderId}/cancel`,
        {},
        { headers: { Authorization: this.authHeader } },
      );
      this.logger.log(`Midtrans transaction cancelled: orderId=${orderId}`);
    } catch (err) {
      const errorData = (err as { response?: { data?: unknown } }).response
        ?.data;
      this.logger.warn(
        `Midtrans cancel failed (may already be settled): ${JSON.stringify(errorData)}`,
      );
    }
  }

  // ─── Verify Webhook Notification ──────────────────────────────────

  verifySignature(notification: MidtransNotification): boolean {
    const { order_id, status_code, gross_amount, signature_key } = notification;

    const expected = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
      .digest('hex');

    return expected === signature_key;
  }

  isPaymentSettled(notification: MidtransNotification): boolean {
    const { transaction_status, fraud_status } = notification;

    return (
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept')
    );
  }
}
