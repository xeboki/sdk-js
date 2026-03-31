import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface ProcessImageParams {
  /**
   * Base64-encoded image data. Provide either `imageBase64` or `imageUrl`.
   */
  imageBase64?: string;
  /**
   * URL of the image to process. Provide either `imageBase64` or `imageUrl`.
   */
  imageUrl?: string;
  /**
   * Output image format. Defaults to 'png'.
   */
  outputFormat?: 'png' | 'jpg' | 'webp';
  /**
   * Output image size. 'preview' = 0.25 megapixels, 'full' = full resolution.
   */
  size?: 'preview' | 'full';
  /**
   * Crop image to the foreground bounding box. Defaults to false.
   */
  crop?: boolean;
  /**
   * Add padding (px) when crop is enabled. Defaults to 0.
   */
  cropMargin?: number;
  /**
   * Background hex color to add (e.g. 'ffffff'). If omitted, transparent.
   */
  bgColor?: string;
  /**
   * Background image URL to add.
   */
  bgImageUrl?: string;
}

export interface ProcessImageResult {
  id: string;
  resultUrl: string;
  resultBase64: string;
  inputWidth: number;
  inputHeight: number;
  outputWidth: number;
  outputHeight: number;
  outputFormat: string;
  creditsUsed: number;
  processingTimeMs: number;
  createdAt: string;
}

export interface QuotaInfo {
  plan: string;
  creditsTotal: number;
  creditsUsed: number;
  creditsRemaining: number;
  resetDate: string;
  freeApiCallsTotal: number;
  freeApiCallsUsed: number;
  freeApiCallsRemaining: number;
}

export interface BatchImageInput {
  imageUrl?: string;
  imageBase64?: string;
  referenceId?: string;
}

export interface CreateBatchParams {
  images: BatchImageInput[];
  outputFormat?: 'png' | 'jpg' | 'webp';
  size?: 'preview' | 'full';
  bgColor?: string;
  webhookUrl?: string;
}

export interface BatchJobResult {
  referenceId?: string;
  status: 'completed' | 'failed';
  resultUrl?: string;
  errorMessage?: string;
}

export interface BatchJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalImages: number;
  processedImages: number;
  failedImages: number;
  results: BatchJobResult[];
  createdAt: string;
  completedAt?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class RemoveBGClient {
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

  async processImage(params: ProcessImageParams): Promise<ProcessImageResult> {
    if (!params.imageBase64 && !params.imageUrl) {
      throw new Error('Either imageBase64 or imageUrl must be provided');
    }
    return this.call({ method: 'POST', path: '/v1/removebg/process', body: params });
  }

  async getQuota(): Promise<QuotaInfo> {
    return this.call({ method: 'GET', path: '/v1/removebg/quota' });
  }

  async createBatch(params: CreateBatchParams): Promise<BatchJob> {
    if (!params.images || params.images.length === 0) {
      throw new Error('At least one image must be provided in the batch');
    }
    return this.call({ method: 'POST', path: '/v1/removebg/batch', body: params });
  }

  async getBatch(id: string): Promise<BatchJob> {
    return this.call({ method: 'GET', path: `/v1/removebg/batch/${id}` });
  }
}
