import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  name: string;
  description?: string;
  product: 'pos' | 'chat' | 'link' | 'removebg' | 'launchpad' | 'account';
  reportType: string;
  availableFilters: string[];
  availableGroupings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListReportsParams {
  limit?: number;
  offset?: number;
  product?: Report['product'];
}

export interface ReportDataPoint {
  label: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface ReportSeries {
  name: string;
  data: Array<{ timestamp: string; value: number }>;
}

export interface ReportData {
  reportId: string;
  name: string;
  generatedAt: string;
  dateRange: { startDate: string; endDate: string };
  summary: ReportDataPoint[];
  series?: ReportSeries[];
  breakdown?: Array<{
    dimension: string;
    values: Array<{ label: string; value: number; percentage: number }>;
  }>;
}

export interface GetReportParams {
  startDate?: string;
  endDate?: string;
  locationId?: string;
  groupBy?: 'day' | 'week' | 'month';
  filters?: Record<string, string>;
}

export interface ExportReportParams {
  reportId: string;
  format: 'csv' | 'pdf' | 'xlsx';
  startDate?: string;
  endDate?: string;
  locationId?: string;
  filters?: Record<string, string>;
  webhookUrl?: string;
}

export interface ExportResult {
  exportId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  format: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class AnalyticsClient {
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

  async listReports(params?: ListReportsParams): Promise<ListResponse<Report>> {
    return this.call({
      method: 'GET',
      path: '/v1/analytics/reports',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getReport(id: string, params?: GetReportParams): Promise<ReportData> {
    return this.call({
      method: 'GET',
      path: `/v1/analytics/reports/${id}`,
      query: {
        startDate: params?.startDate,
        endDate: params?.endDate,
        locationId: params?.locationId,
        groupBy: params?.groupBy,
        ...params?.filters,
      },
    });
  }

  async exportReport(params: ExportReportParams): Promise<ExportResult> {
    return this.call({ method: 'POST', path: '/v1/analytics/reports/export', body: params });
  }
}
