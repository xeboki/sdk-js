export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  requestId: string;
}

export class XebokiError extends Error {
  readonly status: number;
  readonly message: string;
  readonly requestId?: string;
  readonly retryAfter?: number;

  constructor(
    status: number,
    message: string,
    requestId?: string,
    retryAfter?: number,
  ) {
    super(message);
    this.name = 'XebokiError';
    this.status = status;
    this.message = message;
    this.requestId = requestId;
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, XebokiError.prototype);
  }

  toString(): string {
    const parts = [`XebokiError(${this.status}): ${this.message}`];
    if (this.requestId) parts.push(`requestId=${this.requestId}`);
    if (this.retryAfter) parts.push(`retryAfter=${this.retryAfter}s`);
    return parts.join(' ');
  }
}
