import { HttpClient } from './http.js';
import { RateLimitInfo } from './error.js';
import { PosClient } from './products/pos.js';
import { ChatClient } from './products/chat.js';
import { LinkClient } from './products/link.js';
import { RemoveBGClient } from './products/removebg.js';
import { AnalyticsClient } from './products/analytics.js';
import { AccountClient } from './products/account.js';
import { LaunchpadClient } from './products/launchpad.js';
import { OrderingClient } from './products/ordering.js';
import { DeveloperClient } from './products/developer.js';
import { CodeClient } from './products/xecode.js';

export interface XebokiClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class XebokiClient {
  readonly pos: PosClient;
  readonly chat: ChatClient;
  readonly link: LinkClient;
  readonly removebg: RemoveBGClient;
  readonly analytics: AnalyticsClient;
  readonly account: AccountClient;
  readonly launchpad: LaunchpadClient;
  readonly ordering: OrderingClient;
  readonly developer: DeveloperClient;
  readonly code: CodeClient;

  private _lastRateLimit: RateLimitInfo | null = null;

  get lastRateLimit(): RateLimitInfo | null {
    return this._lastRateLimit;
  }

  constructor(options: XebokiClientOptions) {
    if (!options.apiKey) {
      throw new Error('apiKey is required');
    }
    if (!options.apiKey.startsWith('xbk_')) {
      throw new Error('apiKey must start with xbk_live_ or xbk_test_');
    }

    const baseUrl = options.baseUrl ?? 'https://api.xeboki.com';
    const http = new HttpClient(baseUrl, options.apiKey);

    const onRateLimit = (info: RateLimitInfo) => {
      this._lastRateLimit = info;
    };

    this.pos = new PosClient(http, onRateLimit);
    this.chat = new ChatClient(http, onRateLimit);
    this.link = new LinkClient(http, onRateLimit);
    this.removebg = new RemoveBGClient(http, onRateLimit);
    this.analytics = new AnalyticsClient(http, onRateLimit);
    this.account = new AccountClient(http, onRateLimit);
    this.launchpad = new LaunchpadClient(http, onRateLimit);
    this.ordering = new OrderingClient(http, onRateLimit);
    this.developer = new DeveloperClient(http, onRateLimit);
    this.code = new CodeClient(http, onRateLimit);
  }
}
