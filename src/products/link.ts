import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ShortLink {
  id: string;
  shortCode: string;
  shortUrl: string;
  destinationUrl: string;
  title?: string;
  tags?: string[];
  isActive: boolean;
  expiresAt?: string;
  password?: string;
  clickCount: number;
  uniqueClickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListLinksParams {
  limit?: number;
  offset?: number;
  search?: string;
  isActive?: boolean;
  tag?: string;
}

export interface CreateLinkParams {
  destinationUrl: string;
  title?: string;
  customCode?: string;
  tags?: string[];
  expiresAt?: string;
  password?: string;
}

export interface UpdateLinkParams {
  destinationUrl?: string;
  title?: string;
  tags?: string[];
  isActive?: boolean;
  expiresAt?: string | null;
  password?: string | null;
}

export interface LinkAnalytics {
  linkId: string;
  shortCode: string;
  totalClicks: number;
  uniqueClicks: number;
  clicksOverTime: Array<{
    date: string;
    clicks: number;
    uniqueClicks: number;
  }>;
  topReferrers: Array<{ referrer: string; clicks: number }>;
  topCountries: Array<{ country: string; code: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  topDevices: Array<{ device: 'desktop' | 'mobile' | 'tablet'; clicks: number }>;
  topOs: Array<{ os: string; clicks: number }>;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class LinkClient {
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

  async listLinks(params?: ListLinksParams): Promise<ListResponse<ShortLink>> {
    return this.call({
      method: 'GET',
      path: '/v1/link/links',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createLink(params: CreateLinkParams): Promise<ShortLink> {
    return this.call({ method: 'POST', path: '/v1/link/links', body: params });
  }

  async getLink(id: string): Promise<ShortLink> {
    return this.call({ method: 'GET', path: `/v1/link/links/${id}` });
  }

  async updateLink(id: string, params: UpdateLinkParams): Promise<ShortLink> {
    return this.call({ method: 'PATCH', path: `/v1/link/links/${id}`, body: params });
  }

  async deleteLink(id: string): Promise<void> {
    return this.call({ method: 'DELETE', path: `/v1/link/links/${id}` });
  }

  async getAnalytics(
    id: string,
    params?: { startDate?: string; endDate?: string; granularity?: 'day' | 'week' | 'month' },
  ): Promise<LinkAnalytics> {
    return this.call({
      method: 'GET',
      path: `/v1/link/analytics/${id}`,
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }
}
