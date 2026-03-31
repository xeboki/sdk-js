import { XebokiError, RateLimitInfo } from './error.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  isFormData?: boolean;
}

export interface HttpResponse<T> {
  data: T;
  rateLimit: RateLimitInfo;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async request<T>(opts: RequestOptions): Promise<HttpResponse<T>> {
    const url = this.buildUrl(opts.path, opts.query);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
    };

    let bodyPayload: BodyInit | undefined;

    if (opts.body !== undefined && !opts.isFormData) {
      headers['Content-Type'] = 'application/json';
      bodyPayload = JSON.stringify(opts.body);
    } else if (opts.isFormData && opts.body instanceof FormData) {
      bodyPayload = opts.body;
    }

    const response = await fetch(url, {
      method: opts.method,
      headers,
      body: bodyPayload,
    });

    const requestId = response.headers.get('X-Request-Id') ?? undefined;
    const rateLimit: RateLimitInfo = {
      limit: parseInt(response.headers.get('X-RateLimit-Limit') ?? '0', 10),
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') ?? '0', 10),
      reset: parseInt(response.headers.get('X-RateLimit-Reset') ?? '0', 10),
      requestId: requestId ?? '',
    };

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let retryAfter: number | undefined;

      try {
        const errorBody = await response.json() as { message?: string; error?: string };
        errorMessage = errorBody.message ?? errorBody.error ?? errorMessage;
      } catch {
        // body not JSON — use default message
      }

      if (response.status === 429) {
        const retryHeader = response.headers.get('Retry-After');
        retryAfter = retryHeader ? parseInt(retryHeader, 10) : undefined;
      }

      throw new XebokiError(response.status, errorMessage, requestId, retryAfter);
    }

    let data: T;
    const contentType = response.headers.get('Content-Type') ?? '';

    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      data = undefined as T;
    } else if (contentType.includes('application/json')) {
      data = await response.json() as T;
    } else {
      data = (await response.text()) as unknown as T;
    }

    return { data, rateLimit };
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
}
