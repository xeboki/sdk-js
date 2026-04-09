import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface GenerateQRParams {
  /** The data to encode in the QR code. */
  data: string;
  /** Output format. 'png' is available on all plans; 'svg' requires Pro. Defaults to 'png'. */
  format?: 'png' | 'svg';
  /** Scale factor for PNG output (1–20). Defaults to 10. */
  scale?: number;
  /** Foreground hex color without '#'. Defaults to '000000'. */
  darkColor?: string;
  /** Background hex color without '#'. Defaults to 'ffffff'. */
  lightColor?: string;
}

export interface QRResult {
  format: 'png' | 'svg';
  /** Base64-encoded PNG. Present when format is 'png'. */
  base64?: string;
  /** Raw SVG markup. Present when format is 'svg'. */
  svg?: string;
  /** Whether a xeboki.com watermark was applied (free plan). */
  watermarked: boolean;
  /** Total exports used this month. */
  exportsUsed: number;
}

export interface GenerateBarcodeParams {
  /** Barcode format: code128 | ean13 | upca | code39 | itf | ean8 */
  bcid: string;
  /** The text/data to encode. */
  text: string;
  /** Output format. Currently only 'png'. */
  format?: 'png';
}

export interface BarcodeResult {
  format: 'png';
  base64: string;
  watermarked: boolean;
  exportsUsed: number;
}

export interface BatchQRItem {
  data: string;
}

export interface BatchQRParams {
  items: BatchQRItem[];
  /** Output format. 'png' | 'svg'. Defaults to 'png'. */
  format?: 'png' | 'svg';
  /** Scale factor for PNG output. Defaults to 10. */
  scale?: number;
  darkColor?: string;
  lightColor?: string;
}

export interface BatchQRResult {
  count: number;
  results: Array<{ format: string; base64?: string; svg?: string }>;
  exportsUsed: number;
}

export interface CodeUsage {
  plan: string;
  exportsUsed: number;
  exportsLimit: number | null;
  exportsRemaining: number | null;
}

export interface QRType {
  id: string;
  name: string;
  description: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class CodeClient {
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

  /** Generate a single QR code. Returns base64 PNG or SVG markup. */
  async generateQR(params: GenerateQRParams): Promise<QRResult> {
    return this.call({
      method: 'POST',
      path: '/v1/code/qr',
      body: {
        data:        params.data,
        format:      params.format ?? 'png',
        scale:       params.scale ?? 10,
        dark_color:  params.darkColor ?? '000000',
        light_color: params.lightColor ?? 'ffffff',
      },
    });
  }

  /** Generate a linear barcode (Code 128, EAN-13, UPC-A, etc.). Returns base64 PNG. */
  async generateBarcode(params: GenerateBarcodeParams): Promise<BarcodeResult> {
    return this.call({
      method: 'POST',
      path: '/v1/code/barcode',
      body: {
        bcid:   params.bcid,
        text:   params.text,
        format: params.format ?? 'png',
      },
    });
  }

  /**
   * Batch-generate multiple QR codes in a single request.
   * Requires a Pro or Business plan.
   */
  async batchQR(params: BatchQRParams): Promise<BatchQRResult> {
    if (!params.items || params.items.length === 0) {
      throw new Error('At least one item must be provided in the batch');
    }
    return this.call({
      method: 'POST',
      path: '/v1/code/batch/qr',
      body: {
        items:       params.items,
        format:      params.format ?? 'png',
        scale:       params.scale ?? 10,
        dark_color:  params.darkColor ?? '000000',
        light_color: params.lightColor ?? 'ffffff',
      },
    });
  }

  /** Get current export usage for the authenticated API key. */
  async getUsage(): Promise<CodeUsage> {
    return this.call({ method: 'GET', path: '/v1/code/usage' });
  }

  /** List all supported QR and barcode types. */
  async listTypes(): Promise<{ qrTypes: QRType[]; barcodeFormats: QRType[] }> {
    return this.call({ method: 'GET', path: '/v1/code/types' });
  }
}
