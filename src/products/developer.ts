import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  locationIds: string[] | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
}

export interface CreatedApiKey extends ApiKey {
  /** Full key — returned ONCE at creation. Store securely. */
  key: string;
  warning: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  description: string | null;
  isActive: boolean;
  secretPrefix: string;
  createdAt: string;
  lastTriggeredAt: string | null;
  failureCount: number;
}

export interface CreateApiKeyParams {
  name: string;
  scopes: string[];
  locationIds?: string[];
  expiresAt?: string;
}

export interface RegisterWebhookParams {
  url: string;
  events: string[];
  description?: string;
}

export interface TestWebhookParams {
  event?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

/**
 * Manage API keys and webhook endpoints for a subscriber.
 *
 * Requires a POS JWT issued to an admin-role user.
 * All calls are scoped to the authenticated subscriber.
 *
 * @example
 * ```ts
 * const xeboki = new XebokiClient({ apiKey: 'xbk_live_...' });
 *
 * // List API keys
 * const keys = await xeboki.developer.listApiKeys();
 *
 * // Create a key
 * const { key } = await xeboki.developer.createApiKey({
 *   name: 'Mobile Storefront',
 *   scopes: ['pos:read', 'orders:write'],
 * });
 * console.log(key); // Store securely — shown once only
 *
 * // Register a webhook
 * await xeboki.developer.registerWebhook({
 *   url: 'https://example.com/webhooks/xeboki',
 *   events: ['order.created', 'order.status_changed'],
 * });
 * ```
 */
export class DeveloperClient {
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

  // ── API Keys ──────────────────────────────────────────────────────────────

  async listApiKeys(): Promise<ApiKey[]> {
    return this.call({ method: 'GET', path: '/v1/developer/api-keys' });
  }

  async createApiKey(params: CreateApiKeyParams): Promise<CreatedApiKey> {
    return this.call({ method: 'POST', path: '/v1/developer/api-keys', body: params });
  }

  async revokeApiKey(keyId: string): Promise<void> {
    return this.call({ method: 'DELETE', path: `/v1/developer/api-keys/${keyId}` });
  }

  // ── Webhooks ──────────────────────────────────────────────────────────────

  async listWebhooks(): Promise<Webhook[]> {
    return this.call({ method: 'GET', path: '/v1/developer/webhooks' });
  }

  async registerWebhook(params: RegisterWebhookParams): Promise<Webhook> {
    return this.call({ method: 'POST', path: '/v1/developer/webhooks', body: params });
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    return this.call({ method: 'DELETE', path: `/v1/developer/webhooks/${webhookId}` });
  }

  async testWebhook(
    webhookId: string,
    params: TestWebhookParams = {},
  ): Promise<{ status: string; event: string; url: string }> {
    return this.call({
      method: 'POST',
      path: `/v1/developer/webhooks/${webhookId}/test`,
      body: { event: params.event ?? 'order.created' },
    });
  }

  // ── Discovery ─────────────────────────────────────────────────────────────

  async listScopes(): Promise<string[]> {
    const res = await this.call<{ scopes: string[] }>({
      method: 'GET',
      path: '/v1/developer/scopes',
    });
    return res.scopes;
  }

  async listEvents(): Promise<string[]> {
    const res = await this.call<{ events: string[] }>({
      method: 'GET',
      path: '/v1/developer/events',
    });
    return res.events;
  }
}
