import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  modifiers?: Array<{ name: string; price: number }>;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  customerId?: string;
  locationId: string;
  employeeId: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListOrdersParams {
  limit?: number;
  offset?: number;
  status?: Order['status'];
  locationId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateOrderParams {
  items: Array<{
    productId: string;
    quantity: number;
    modifiers?: Array<{ modifierId: string }>;
  }>;
  customerId?: string;
  locationId: string;
  paymentMethod: string;
  discount?: number;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  price: number;
  cost?: number;
  taxRate: number;
  imageUrl?: string;
  isActive: boolean;
  trackInventory: boolean;
  locationId: string;
  modifierGroupIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
  locationId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  price: number;
  cost?: number;
  taxRate?: number;
  imageUrl?: string;
  isActive?: boolean;
  trackInventory?: boolean;
  locationId: string;
  modifierGroupIds?: string[];
}

export interface UpdateProductParams {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  price?: number;
  cost?: number;
  taxRate?: number;
  imageUrl?: string;
  isActive?: boolean;
  trackInventory?: boolean;
  modifierGroupIds?: string[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  quantity: number;
  lowStockThreshold?: number;
  unit: string;
  lastUpdated: string;
}

export interface UpdateInventoryParams {
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  loyaltyPoints?: number;
  totalSpend?: number;
  visitCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCustomersParams {
  limit?: number;
  offset?: number;
  search?: string;
  email?: string;
}

export interface CreateCustomerParams {
  name: string;
  email?: string;
  phone?: string;
  address?: Customer['address'];
  notes?: string;
}

export interface SalesReport {
  locationId: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  netRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }>;
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  paymentBreakdown: Array<{ method: string; amount: number; count: number }>;
}

export interface PosSession {
  id: string;
  locationId: string;
  employeeId: string;
  employeeName: string;
  openedAt: string;
  closedAt?: string;
  status: 'open' | 'closed';
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  totalOrders: number;
}

export interface ListSessionsParams {
  limit?: number;
  offset?: number;
  locationId?: string;
  status?: PosSession['status'];
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class PosClient {
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

  async listOrders(params?: ListOrdersParams): Promise<ListResponse<Order>> {
    return this.call({
      method: 'GET',
      path: '/v1/pos/orders',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createOrder(params: CreateOrderParams): Promise<Order> {
    return this.call({ method: 'POST', path: '/v1/pos/orders', body: params });
  }

  async getOrder(id: string): Promise<Order> {
    return this.call({ method: 'GET', path: `/v1/pos/orders/${id}` });
  }

  async listProducts(params?: ListProductsParams): Promise<ListResponse<Product>> {
    return this.call({
      method: 'GET',
      path: '/v1/pos/products',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createProduct(params: CreateProductParams): Promise<Product> {
    return this.call({ method: 'POST', path: '/v1/pos/products', body: params });
  }

  async updateProduct(id: string, params: UpdateProductParams): Promise<Product> {
    return this.call({ method: 'PUT', path: `/v1/pos/products/${id}`, body: params });
  }

  async listInventory(params?: { locationId?: string; lowStockOnly?: boolean }): Promise<ListResponse<InventoryItem>> {
    return this.call({
      method: 'GET',
      path: '/v1/pos/inventory',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async updateInventory(id: string, params: UpdateInventoryParams): Promise<InventoryItem> {
    return this.call({ method: 'PUT', path: `/v1/pos/inventory/${id}`, body: params });
  }

  async listCustomers(params?: ListCustomersParams): Promise<ListResponse<Customer>> {
    return this.call({
      method: 'GET',
      path: '/v1/pos/customers',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createCustomer(params: CreateCustomerParams): Promise<Customer> {
    return this.call({ method: 'POST', path: '/v1/pos/customers', body: params });
  }

  async getSalesReport(params?: {
    startDate?: string;
    endDate?: string;
    locationId?: string;
  }): Promise<SalesReport> {
    return this.call({
      method: 'GET',
      path: '/v1/pos/reports/sales',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async listSessions(params?: ListSessionsParams): Promise<ListResponse<PosSession>> {
    return this.call({
      method: 'GET',
      path: '/v1/pos/sessions',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }
}
