import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface LaunchpadCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  metadata?: Record<string, string>;
  activeSubscriptions: number;
  totalSpend: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListLaunchpadCustomersParams {
  limit?: number;
  offset?: number;
  search?: string;
  email?: string;
}

export interface CreateLaunchpadCustomerParams {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  metadata?: Record<string, string>;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  product: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  isActive: boolean;
  isPublic: boolean;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  plan: Plan;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  quantity: number;
  couponId?: string;
  discountAmount?: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ListSubscriptionsParams {
  limit?: number;
  offset?: number;
  customerId?: string;
  planId?: string;
  status?: Subscription['status'];
}

export interface CreateSubscriptionParams {
  customerId: string;
  planId: string;
  quantity?: number;
  couponCode?: string;
  trialEnd?: string;
  metadata?: Record<string, string>;
  paymentMethodId?: string;
}

export interface LaunchpadInvoice {
  id: string;
  number: string;
  customerId: string;
  subscriptionId?: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
    amount: number;
  }>;
  discountAmount?: number;
  taxAmount?: number;
  dueDate?: string;
  paidAt?: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency?: string;
  maxRedemptions?: number;
  redemptionCount: number;
  validFrom?: string;
  validUntil?: string;
  appliesTo?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponParams {
  code: string;
  name: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency?: string;
  maxRedemptions?: number;
  validFrom?: string;
  validUntil?: string;
  appliesTo?: string[];
}

export interface AnalyticsOverview {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  mrrGrowthPercent: number;
  activeSubscriptions: number;
  newSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
  totalCustomers: number;
  newCustomers: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  revenueOverTime: Array<{ date: string; mrr: number; newRevenue: number; churnedRevenue: number }>;
  topPlans: Array<{ planId: string; name: string; subscriptions: number; revenue: number }>;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class LaunchpadClient {
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

  async listCustomers(params?: ListLaunchpadCustomersParams): Promise<ListResponse<LaunchpadCustomer>> {
    return this.call({
      method: 'GET',
      path: '/v1/launchpad/customers',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createCustomer(params: CreateLaunchpadCustomerParams): Promise<LaunchpadCustomer> {
    return this.call({ method: 'POST', path: '/v1/launchpad/customers', body: params });
  }

  async getCustomer(id: string): Promise<LaunchpadCustomer> {
    return this.call({ method: 'GET', path: `/v1/launchpad/customers/${id}` });
  }

  async listSubscriptions(params?: ListSubscriptionsParams): Promise<ListResponse<Subscription>> {
    return this.call({
      method: 'GET',
      path: '/v1/launchpad/subscriptions',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    return this.call({ method: 'POST', path: '/v1/launchpad/subscriptions', body: params });
  }

  async cancelSubscription(id: string, params?: { cancelAtPeriodEnd?: boolean }): Promise<Subscription> {
    return this.call({
      method: 'DELETE',
      path: `/v1/launchpad/subscriptions/${id}`,
      body: params,
    });
  }

  async listPlans(params?: { isActive?: boolean; isPublic?: boolean; product?: string }): Promise<ListResponse<Plan>> {
    return this.call({
      method: 'GET',
      path: '/v1/launchpad/plans',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async listInvoices(params?: { limit?: number; offset?: number; customerId?: string; subscriptionId?: string }): Promise<ListResponse<LaunchpadInvoice>> {
    return this.call({
      method: 'GET',
      path: '/v1/launchpad/invoices',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async listCoupons(params?: { limit?: number; offset?: number; isActive?: boolean }): Promise<ListResponse<Coupon>> {
    return this.call({
      method: 'GET',
      path: '/v1/launchpad/coupons',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createCoupon(params: CreateCouponParams): Promise<Coupon> {
    return this.call({ method: 'POST', path: '/v1/launchpad/coupons', body: params });
  }

  async getAnalyticsOverview(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AnalyticsOverview> {
    return this.call({
      method: 'GET',
      path: '/v1/launchpad/analytics/overview',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }
}
