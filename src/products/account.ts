import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface AccountProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  avatarUrl?: string;
  timezone: string;
  locale: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileParams {
  name?: string;
  phone?: string;
  company?: string;
  timezone?: string;
  locale?: string;
}

export interface AccountSubscription {
  id: string;
  product: string;
  plan: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  quantity: number;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

export interface AccountInvoice {
  id: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  subscriptionId?: string;
  dueDate?: string;
  paidAt?: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'paypal';
  isDefault: boolean;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  bankAccount?: {
    bankName: string;
    last4: string;
    currency: string;
  };
  paypal?: {
    email: string;
  };
  billingDetails: {
    name?: string;
    email?: string;
    address?: {
      line1?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  createdAt: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class AccountClient {
  private readonly http: HttpClient;
  private readonly onRateLimit: (info: RateLimitInfo) => void;

  constructor(http: HttpClient, onRateLimit: (info: RateLimitInfo) => void) {
    this.http = http;
    this.onRateLimit = onRateLimit;
  }

  private async call<T>(opts: Parameters<HttpClient['request']>[0]): Promise<T> {
    const res = await this.http.request<T>(opts);
    this.onRateLimit(res.rateLimit);
    return res.data;
  }

  async getProfile(): Promise<AccountProfile> {
    return this.call({ method: 'GET', path: '/v1/account/me' });
  }

  async updateProfile(params: UpdateProfileParams): Promise<AccountProfile> {
    return this.call({ method: 'PATCH', path: '/v1/account/me', body: params });
  }

  async listSubscriptions(): Promise<ListResponse<AccountSubscription>> {
    return this.call({ method: 'GET', path: '/v1/account/subscriptions' });
  }

  async listInvoices(params?: { limit?: number; offset?: number; status?: AccountInvoice['status'] }): Promise<ListResponse<AccountInvoice>> {
    return this.call({
      method: 'GET',
      path: '/v1/account/invoices',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async listPaymentMethods(): Promise<ListResponse<PaymentMethod>> {
    return this.call({ method: 'GET', path: '/v1/account/payment-methods' });
  }
}
