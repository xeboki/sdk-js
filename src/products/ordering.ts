import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface OrderingCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number | null;
  maxSelections: number | null;
  options: ModifierOption[];
}

/** One selectable variant (e.g. "Red / L"). price=null means inherit from product. */
export interface ProductVariant {
  id: string;
  label: string;                          // "Red / L"
  attributes: Record<string, string>;     // { Color: 'Red', Size: 'L' }
  sku: string | null;
  barcode: string | null;
  imageUrl: string | null;
  price: number | null;                   // null = inherit product price
  compareAtPrice: number | null;
  stock: number;
  stockByLocation: Record<string, number>;
  sortOrder: number;
}

/** Defines one variant axis (e.g. Size with values S / M / L). */
export interface VariantOption {
  name: string;
  values: string[];
}

export interface OrderingProduct {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
  trackInventory: boolean;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  stockQuantity: number | null;
  hasVariants: boolean;
  variantOptions: VariantOption[];
  variants: ProductVariant[];             // populated on getProduct(), empty on listProducts()
  modifierGroups: ModifierGroup[];
  tags: string[];
}

export interface OrderingCustomer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  storeCredit: number;
  loyaltyPoints: number;
}

export interface CustomerAuth {
  customer: OrderingCustomer;
  token: string;
}

export interface OrderingLineItem {
  productId: string;
  variantId: string | null;
  variantLabel: string | null;
  variantAttributes: Record<string, string> | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifierNames: string[];
  notes: string | null;
}

export interface OrderingOrder {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paidTotal: number;
  items: OrderingLineItem[];
  customerId: string | null;
  tableId: string | null;
  notes: string | null;
  reference: string | null;
  deliveryAddress: string | null;
  scheduledAt: string | null;
  createdAt: string;
}

export interface DiscountValidation {
  valid: boolean;
  type: string | null;
  reason: string | null;
  value: number | null;
  discountAmount: number | null;
}

export interface OrderingAppointment {
  id: string;
  status: string;
  serviceId: string;
  serviceName: string;
  customerId: string | null;
  customerName: string | null;
  staffId: string | null;
  staffName: string | null;
  notes: string | null;
  startTime: string;
  durationMinutes: number;
}

export interface OrderingTable {
  id: string;
  name: string;
  status: string;
  capacity: number | null;
  section: string | null;
}

export interface OrderingStaff {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
  isActive: boolean;
}

export interface OrderingListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface KeyValidationResult {
  valid: boolean;
  subscriberId: string;
  subStatus: string;
  subPlan: string;
}

export interface OrderingFirebaseConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  customToken: string | null;
}

export interface CreateOrderItem {
  productId: string;
  /** Required when the product has variants (hasVariants === true). */
  variantId?: string;
  quantity: number;
  modifiers?: Array<{ modifierId: string }>;
  notes?: string;
}

export interface CreateOrderingOrderParams {
  orderType: string;
  items: CreateOrderItem[];
  customerId?: string;
  /** Guest contact info — used when no customerId is provided (guest checkout). */
  guestName?: string;
  guestEmail?: string;
  notes?: string;
  tableId?: string;
  scheduledAt?: string;
  deliveryAddress?: string;
  idempotencyKey?: string;
  loyaltyPointsRedeemed?: number;
}

export interface StoreConfig {
  businessType: string;
  businessName: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  taxLabel: string;
  taxRate: number;
  supportEmail: string;
  supportPhone: string;
  website: string;
  address: Record<string, unknown>;
}

export interface NavLink {
  label: string;
  url: string;
  openInNewTab?: boolean;
}

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface StorefrontConfig {
  storefrontSlug: string | null;
  isPublished: boolean;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  heroTitle: string;
  heroSubtitle: string;
  featuredCategoryIds: string[];
  featuredProductIds: string[];
  announcementBar: string | null;
  seoTitle: string;
  seoDescription: string;
  /** Title template used on inner pages — %s is replaced by page title. Default: '%s | {businessName}' */
  seoTitleTemplate: string | null;
  /** Default OG/share image URL for pages that have no product/post image */
  seoOgImageUrl: string | null;
  /** Google Search Console meta tag verification code */
  googleVerificationCode: string | null;
  /** Inject Organization/LocalBusiness JSON-LD structured data on every page */
  structuredDataEnabled: boolean;
  /** Custom nav links shown in the header (appended after built-in links) */
  navLinks: NavLink[];
  /** Footer columns with custom links */
  footerColumns: FooterColumn[];
  socialLinks: Record<string, string>;
  customDomain: string | null;
  updatedAt: string | null;
}

export interface UpdateStorefrontConfigParams {
  storefrontSlug?: string;
  isPublished?: boolean;
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  logoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  featuredCategoryIds?: string[];
  featuredProductIds?: string[];
  announcementBar?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoTitleTemplate?: string;
  seoOgImageUrl?: string;
  googleVerificationCode?: string;
  structuredDataEnabled?: boolean;
  navLinks?: NavLink[];
  footerColumns?: FooterColumn[];
  socialLinks?: Record<string, string>;
  customDomain?: string;
}

// ─── Blog ──────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  /** Markdown body content */
  body: string;
  featuredImageUrl: string | null;
  tags: string[];
  status: 'draft' | 'published';
  authorName: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostParams {
  title: string;
  body: string;
  slug?: string;
  excerpt?: string;
  featuredImageUrl?: string;
  tags?: string[];
  status?: 'draft' | 'published';
  authorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string;
}

export type UpdateBlogPostParams = Partial<CreateBlogPostParams>;

// ─── Custom pages ──────────────────────────────────────────────────────────────

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  /** Markdown or HTML body content */
  body: string;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  showInNav: boolean;
  showInFooter: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomPageParams {
  title: string;
  body: string;
  slug?: string;
  isPublished?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  showInNav?: boolean;
  showInFooter?: boolean;
}

export interface StripePaymentIntent {
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  connectedAccountId: string | null;
}

export interface GiftCard {
  id: string;
  code: string;
  balance: number;
  initialValue: number;
  currency: string;
  status: string;
  expiresAt: string | null;
  issuedAt: string | null;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postcode: string;
  country: string;
  isDefault: boolean;
  createdAt: string | null;
}

export interface AddressParams {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postcode: string;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateCustomerParams {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
  notes?: string;
}

export interface CreateAppointmentParams {
  customerId: string;
  serviceId: string;
  staffId?: string;
  startTime: string;
  durationMinutes?: number;
  notes?: string;
}

// ─── Client ───────────────────────────────────────────────────────────────────

/**
 * Customer-facing ordering API client.
 *
 * ## Architecture note — Firestore-direct
 *
 * The official Xeboki Ordering App reads catalog, orders, and customers
 * **directly from the subscriber's Firestore** rather than going through the
 * REST API. This halves latency and removes API load at scale.
 *
 * To adopt the same pattern:
 * 1. Call {@link getFirebaseConfig} on startup — returns the subscriber's
 *    Firebase project config + a short-lived custom auth token.
 * 2. Initialise a secondary Firebase app with the returned config.
 * 3. Sign in with `signInWithCustomToken(customToken)`.
 * 4. Read Firestore directly: `categories`, `products`, `orders`, `customers`.
 *
 * All REST methods below remain available for simpler integrations or
 * environments where Firestore is not an option.
 *
 * @example
 * ```ts
 * const xeboki = new XebokiClient({ apiKey: 'xbk_live_...' });
 *
 * // Option A — Firestore-direct (recommended for real-time apps)
 * const fbConfig = await xeboki.ordering.getFirebaseConfig();
 * // … initialise secondary Firebase app with fbConfig …
 *
 * // Option B — REST API
 * const products = await xeboki.ordering.listProducts({ limit: 20 });
 * const { token } = await xeboki.ordering.loginCustomer({ email: '...', password: '...' });
 * ```
 */
export class OrderingClient {
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

  private async callList<T>(
    opts: Parameters<HttpClient['request']>[0],
    key: string,
  ): Promise<OrderingListResponse<T>> {
    const res = await this.http.request<Record<string, unknown>>(opts);
    this.onRateLimit(res.rateLimit);
    const raw = res.data;
    const list = (Array.isArray(raw) ? raw : ((raw[key] ?? raw['data'] ?? []) as unknown[])) as T[];
    return {
      data: list,
      total: (raw['total'] as number | undefined) ?? list.length,
      limit: (raw['limit'] as number | undefined) ?? 50,
      offset: (raw['offset'] as number | undefined) ?? 0,
    };
  }

  // ── Startup validation ──────────────────────────────────────────────────────

  /** Validates the API key and POS subscription on app startup. */
  async validateApiKey(): Promise<KeyValidationResult> {
    const raw = await this.call<{
      valid: boolean;
      subscriber_id: string;
      subscription?: { status: string; plan: string };
    }>({ method: 'GET', path: '/v1/pos/validate' });
    return {
      valid: raw.valid,
      subscriberId: raw.subscriber_id,
      subStatus: raw.subscription?.status ?? '',
      subPlan: raw.subscription?.plan ?? '',
    };
  }

  // ── Firebase config ─────────────────────────────────────────────────────────

  /**
   * Returns the subscriber's Firebase project config + a short-lived custom
   * auth token, enabling direct Firestore access for reads.
   *
   * Cache the result. The custom token expires in 1 hour.
   */
  async getFirebaseConfig(): Promise<OrderingFirebaseConfig> {
    const raw = await this.call<{
      firebase_config?: {
        api_key: string;
        project_id: string;
        app_id: string;
        auth_domain: string;
        storage_bucket: string;
        messaging_sender_id: string;
      };
      custom_token?: string;
    }>({ method: 'GET', path: '/v1/pos/firebase-config' });
    const cfg = raw.firebase_config ?? (raw as typeof raw.firebase_config)!;
    return {
      apiKey: cfg.api_key,
      projectId: cfg.project_id,
      appId: cfg.app_id,
      authDomain: cfg.auth_domain,
      storageBucket: cfg.storage_bucket,
      messagingSenderId: cfg.messaging_sender_id,
      customToken: raw.custom_token ?? null,
    };
  }

  // ── FCM token ───────────────────────────────────────────────────────────────

  /**
   * Registers a customer's FCM token for order-status push notifications.
   * Idempotent — safe to call every app launch.
   */
  async registerCustomerFcmToken(
    customerId: string,
    fcmToken: string,
    opts: { platform?: 'android' | 'ios' | 'web'; deviceId?: string } = {},
  ): Promise<void> {
    return this.call({
      method: 'POST',
      path: '/v1/pos/customers/fcm-token',
      body: {
        customer_id: customerId,
        fcm_token: fcmToken,
        ...(opts.platform !== undefined && { platform: opts.platform }),
        ...(opts.deviceId !== undefined && { device_id: opts.deviceId }),
      },
    });
  }

  // ── Catalog ─────────────────────────────────────────────────────────────────

  async listCategories(opts: { locationId?: string } = {}): Promise<OrderingListResponse<OrderingCategory>> {
    return this.callList<OrderingCategory>(
      { method: 'GET', path: '/v1/pos/catalog/categories', query: { location_id: opts.locationId } },
      'categories',
    );
  }

  async listProducts(opts: {
    categoryId?: string;
    search?: string;
    locationId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderingListResponse<OrderingProduct>> {
    return this.callList<OrderingProduct>(
      {
        method: 'GET',
        path: '/v1/pos/catalog/products',
        query: {
          category_id: opts.categoryId,
          search: opts.search,
          location_id: opts.locationId,
          limit: opts.limit ?? 40,
          offset: opts.offset ?? 0,
        },
      },
      'products',
    );
  }

  async getProduct(id: string): Promise<OrderingProduct> {
    const raw = await this.call<{ product?: OrderingProduct } | OrderingProduct>(
      { method: 'GET', path: `/v1/pos/catalog/products/${id}` },
    );
    return ('product' in raw && raw.product) ? raw.product : raw as OrderingProduct;
  }

  // ── Customer auth ───────────────────────────────────────────────────────────

  async registerCustomer(params: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }): Promise<CustomerAuth> {
    return this.call({
      method: 'POST',
      path: '/v1/pos/customers/register',
      body: {
        email: params.email,
        password: params.password,
        ...(params.fullName !== undefined && { full_name: params.fullName }),
        ...(params.phone !== undefined && { phone: params.phone }),
      },
    });
  }

  async loginCustomer(params: { email: string; password: string }): Promise<CustomerAuth> {
    return this.call({
      method: 'POST',
      path: '/v1/pos/customers/login',
      body: { email: params.email, password: params.password },
    });
  }

  async getCustomer(id: string): Promise<OrderingCustomer | null> {
    try {
      const raw = await this.call<{ customer?: OrderingCustomer } | OrderingCustomer>(
        { method: 'GET', path: `/v1/pos/customers/${id}` },
      );
      return ('customer' in raw && raw.customer) ? raw.customer : raw as OrderingCustomer;
    } catch {
      return null;
    }
  }

  // ── Discounts ───────────────────────────────────────────────────────────────

  async validateDiscount(
    code: string,
    opts: { orderTotal?: number; locationId?: string } = {},
  ): Promise<DiscountValidation> {
    return this.call({
      method: 'POST',
      path: '/v1/pos/discounts/validate',
      body: {
        code,
        ...(opts.orderTotal !== undefined && { order_total: opts.orderTotal }),
        ...(opts.locationId !== undefined && { location_id: opts.locationId }),
      },
    });
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  async listOrders(opts: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderingListResponse<OrderingOrder>> {
    return this.callList<OrderingOrder>(
      {
        method: 'GET',
        path: '/v1/pos/orders',
        query: {
          customer_id: opts.customerId,
          status: opts.status,
          limit: opts.limit ?? 20,
          offset: opts.offset ?? 0,
        },
      },
      'orders',
    );
  }

  async getOrder(id: string): Promise<OrderingOrder> {
    const raw = await this.call<{ order?: OrderingOrder } | OrderingOrder>(
      { method: 'GET', path: `/v1/pos/orders/${id}` },
    );
    return ('order' in raw && raw.order) ? raw.order : raw as OrderingOrder;
  }

  async createOrder(params: CreateOrderingOrderParams): Promise<OrderingOrder> {
    const raw = await this.call<{ order?: OrderingOrder } | OrderingOrder>({
      method: 'POST',
      path: '/v1/pos/orders',
      body: {
        order_type: params.orderType,
        items: params.items,
        ...(params.customerId !== undefined && { customer_id: params.customerId }),
        ...(params.guestName !== undefined && { guest_name: params.guestName }),
        ...(params.guestEmail !== undefined && { guest_email: params.guestEmail }),
        ...(params.notes !== undefined && { notes: params.notes }),
        ...(params.tableId !== undefined && { table_id: params.tableId }),
        ...(params.scheduledAt !== undefined && { scheduled_at: params.scheduledAt }),
        ...(params.deliveryAddress !== undefined && { delivery_address: params.deliveryAddress }),
        ...(params.idempotencyKey !== undefined && { idempotency_key: params.idempotencyKey }),
        ...(params.loyaltyPointsRedeemed !== undefined && params.loyaltyPointsRedeemed > 0 && {
          loyalty_points_redeemed: params.loyaltyPointsRedeemed,
        }),
      },
    });
    return ('order' in raw && raw.order) ? raw.order : raw as OrderingOrder;
  }

  async payOrder(
    id: string,
    params: { method: string; amount: number; reference?: string },
  ): Promise<OrderingOrder> {
    const raw = await this.call<{ order?: OrderingOrder } | OrderingOrder>({
      method: 'POST',
      path: `/v1/pos/orders/${id}/pay`,
      body: {
        method: params.method,
        amount: params.amount,
        ...(params.reference !== undefined && { reference: params.reference }),
      },
    });
    return ('order' in raw && raw.order) ? raw.order : raw as OrderingOrder;
  }

  // ── Tables ──────────────────────────────────────────────────────────────────

  async listTables(opts: { locationId?: string; status?: string } = {}): Promise<OrderingListResponse<OrderingTable>> {
    return this.callList<OrderingTable>(
      { method: 'GET', path: '/v1/pos/tables', query: { location_id: opts.locationId, status: opts.status } },
      'tables',
    );
  }

  // ── Appointments ─────────────────────────────────────────────────────────────

  async listAppointments(opts: {
    customerId?: string;
    status?: string;
    date?: string;
    staffId?: string;
  } = {}): Promise<OrderingListResponse<OrderingAppointment>> {
    return this.callList<OrderingAppointment>(
      {
        method: 'GET',
        path: '/v1/pos/appointments',
        query: {
          customer_id: opts.customerId,
          status: opts.status,
          date: opts.date,
          staff_id: opts.staffId,
        },
      },
      'appointments',
    );
  }

  async createAppointment(params: CreateAppointmentParams): Promise<OrderingAppointment> {
    const raw = await this.call<{ appointment?: OrderingAppointment } | OrderingAppointment>({
      method: 'POST',
      path: '/v1/pos/appointments',
      body: {
        customer_id: params.customerId,
        service_id: params.serviceId,
        start_time: params.startTime,
        duration_minutes: params.durationMinutes ?? 60,
        ...(params.staffId !== undefined && { staff_id: params.staffId }),
        ...(params.notes !== undefined && { notes: params.notes }),
      },
    });
    return ('appointment' in raw && raw.appointment) ? raw.appointment : raw as OrderingAppointment;
  }

  async updateAppointmentStatus(id: string, status: string): Promise<OrderingAppointment> {
    const raw = await this.call<{ appointment?: OrderingAppointment } | OrderingAppointment>({
      method: 'PATCH',
      path: `/v1/pos/appointments/${id}/status`,
      body: { status },
    });
    return ('appointment' in raw && raw.appointment) ? raw.appointment : raw as OrderingAppointment;
  }

  // ── Staff ────────────────────────────────────────────────────────────────────

  async listStaff(opts: { locationId?: string; isActive?: boolean } = {}): Promise<OrderingListResponse<OrderingStaff>> {
    return this.callList<OrderingStaff>(
      {
        method: 'GET',
        path: '/v1/pos/staff',
        query: {
          location_id: opts.locationId,
          is_active: opts.isActive,
        },
      },
      'staff',
    );
  }

  // ── Store & storefront config ─────────────────────────────────────────────

  /** Business name, currency, timezone, tax settings — read from POS setup. */
  async getStoreConfig(): Promise<StoreConfig> {
    const raw = await this.call<Record<string, unknown>>({ method: 'GET', path: '/v1/pos/store-config' });
    return {
      businessType:   raw['business_type'] as string,
      businessName:   raw['business_name'] as string,
      currencyCode:   raw['currency_code'] as string,
      currencySymbol: raw['currency_symbol'] as string,
      timezone:       raw['timezone'] as string,
      taxLabel:       raw['tax_label'] as string,
      taxRate:        raw['tax_rate'] as number,
      supportEmail:   raw['support_email'] as string,
      supportPhone:   raw['support_phone'] as string,
      website:        raw['website'] as string,
      address:        (raw['address'] ?? {}) as Record<string, unknown>,
    };
  }

  /** Ecommerce storefront theme, colors, hero, featured collections, SEO defaults. */
  async getStorefrontConfig(): Promise<StorefrontConfig> {
    const raw = await this.call<Record<string, unknown>>({ method: 'GET', path: '/v1/pos/storefront-config' });
    return {
      storefrontSlug:          (raw['storefront_slug'] as string | null) ?? null,
      isPublished:             (raw['is_published'] as boolean) ?? false,
      theme:                   (raw['theme'] as string) ?? 'minimal',
      primaryColor:            (raw['primary_color'] as string) ?? '#000000',
      secondaryColor:          (raw['secondary_color'] as string) ?? '#ffffff',
      font:                    (raw['font'] as string) ?? 'inter',
      logoUrl:                 (raw['logo_url'] as string | null) ?? null,
      faviconUrl:              (raw['favicon_url'] as string | null) ?? null,
      heroImageUrl:            (raw['hero_image_url'] as string | null) ?? null,
      heroTitle:               (raw['hero_title'] as string) ?? '',
      heroSubtitle:            (raw['hero_subtitle'] as string) ?? '',
      featuredCategoryIds:     (raw['featured_category_ids'] as string[]) ?? [],
      featuredProductIds:      (raw['featured_product_ids'] as string[]) ?? [],
      announcementBar:         (raw['announcement_bar'] as string | null) ?? null,
      seoTitle:                (raw['seo_title'] as string) ?? '',
      seoDescription:          (raw['seo_description'] as string) ?? '',
      seoTitleTemplate:        (raw['seo_title_template'] as string | null) ?? null,
      seoOgImageUrl:           (raw['seo_og_image_url'] as string | null) ?? null,
      googleVerificationCode:  (raw['google_verification_code'] as string | null) ?? null,
      structuredDataEnabled:   (raw['structured_data_enabled'] as boolean) ?? false,
      navLinks:                (raw['nav_links'] as NavLink[]) ?? [],
      footerColumns:           (raw['footer_columns'] as FooterColumn[]) ?? [],
      socialLinks:             (raw['social_links'] as Record<string, string>) ?? {},
      customDomain:            (raw['custom_domain'] as string | null) ?? null,
      updatedAt:               (raw['updated_at'] as string | null) ?? null,
    };
  }

  /** Saves storefront config. Only fields provided are updated (partial update). */
  async updateStorefrontConfig(params: UpdateStorefrontConfigParams): Promise<StorefrontConfig> {
    return this.call({
      method: 'PUT',
      path: '/v1/pos/storefront-config',
      body: {
        ...(params.storefrontSlug !== undefined && { storefront_slug: params.storefrontSlug }),
        ...(params.isPublished !== undefined && { is_published: params.isPublished }),
        ...(params.theme !== undefined && { theme: params.theme }),
        ...(params.primaryColor !== undefined && { primary_color: params.primaryColor }),
        ...(params.secondaryColor !== undefined && { secondary_color: params.secondaryColor }),
        ...(params.font !== undefined && { font: params.font }),
        ...(params.logoUrl !== undefined && { logo_url: params.logoUrl }),
        ...(params.faviconUrl !== undefined && { favicon_url: params.faviconUrl }),
        ...(params.heroImageUrl !== undefined && { hero_image_url: params.heroImageUrl }),
        ...(params.heroTitle !== undefined && { hero_title: params.heroTitle }),
        ...(params.heroSubtitle !== undefined && { hero_subtitle: params.heroSubtitle }),
        ...(params.featuredCategoryIds !== undefined && { featured_category_ids: params.featuredCategoryIds }),
        ...(params.featuredProductIds !== undefined && { featured_product_ids: params.featuredProductIds }),
        ...(params.announcementBar !== undefined && { announcement_bar: params.announcementBar }),
        ...(params.seoTitle !== undefined && { seo_title: params.seoTitle }),
        ...(params.seoDescription !== undefined && { seo_description: params.seoDescription }),
        ...(params.seoTitleTemplate !== undefined && { seo_title_template: params.seoTitleTemplate }),
        ...(params.seoOgImageUrl !== undefined && { seo_og_image_url: params.seoOgImageUrl }),
        ...(params.googleVerificationCode !== undefined && { google_verification_code: params.googleVerificationCode }),
        ...(params.structuredDataEnabled !== undefined && { structured_data_enabled: params.structuredDataEnabled }),
        ...(params.navLinks !== undefined && { nav_links: params.navLinks }),
        ...(params.footerColumns !== undefined && { footer_columns: params.footerColumns }),
        ...(params.socialLinks !== undefined && { social_links: params.socialLinks }),
        ...(params.customDomain !== undefined && { custom_domain: params.customDomain }),
      },
    });
  }

  // ── Stripe ────────────────────────────────────────────────────────────────

  /** Creates a Stripe PaymentIntent. Use the returned clientSecret with Stripe.js. */
  async createStripePaymentIntent(orderId: string): Promise<StripePaymentIntent> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/orders/${orderId}/stripe/intent`,
    });
    return {
      clientSecret:       raw['client_secret'] as string,
      publishableKey:     raw['publishable_key'] as string,
      paymentIntentId:    raw['payment_intent_id'] as string,
      amount:             raw['amount'] as number,
      currency:           raw['currency'] as string,
      connectedAccountId: (raw['connected_account_id'] as string | null) ?? null,
    };
  }

  /** Confirms payment after Stripe.js succeeds. Marks the order as completed. */
  async confirmStripePayment(
    orderId: string,
    paymentIntentId: string,
  ): Promise<{ orderId: string; status: string; paidAt: string }> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/orders/${orderId}/stripe/confirm`,
      body: { payment_intent_id: paymentIntentId },
    });
    return {
      orderId: raw['order_id'] as string,
      status:  raw['status'] as string,
      paidAt:  raw['paid_at'] as string,
    };
  }

  // ── Gift cards ────────────────────────────────────────────────────────────

  /** Looks up a gift card balance and validity. Returns null if not found. */
  async getGiftCard(code: string): Promise<GiftCard | null> {
    try {
      const raw = await this.call<Record<string, unknown>>({
        method: 'GET',
        path: `/v1/pos/gift-cards/${encodeURIComponent(code.toUpperCase())}`,
      });
      return {
        id:           raw['id'] as string,
        code:         raw['code'] as string,
        balance:      raw['balance'] as number,
        initialValue: raw['initial_value'] as number,
        currency:     raw['currency'] as string,
        status:       raw['status'] as string,
        expiresAt:    (raw['expires_at'] as string | null) ?? null,
        issuedAt:     (raw['issued_at'] as string | null) ?? null,
      };
    } catch {
      return null;
    }
  }

  // ── Product slug lookup ───────────────────────────────────────────────────

  /** Fetches a product by its URL slug — use for SEO-friendly product pages. */
  async getProductBySlug(slug: string): Promise<OrderingProduct | null> {
    try {
      const raw = await this.call<{ product?: OrderingProduct } | OrderingProduct>({
        method: 'GET',
        path: `/v1/pos/catalog/slug/${encodeURIComponent(slug)}`,
      });
      return ('product' in raw && raw.product) ? raw.product : raw as OrderingProduct;
    } catch {
      return null;
    }
  }

  // ── Customer profile update ───────────────────────────────────────────────

  async updateCustomer(customerId: string, params: UpdateCustomerParams): Promise<OrderingCustomer> {
    return this.call({
      method: 'PATCH',
      path: `/v1/pos/customers/${customerId}`,
      body: {
        ...(params.name !== undefined && { name: params.name }),
        ...(params.firstName !== undefined && { first_name: params.firstName }),
        ...(params.lastName !== undefined && { last_name: params.lastName }),
        ...(params.phone !== undefined && { phone: params.phone }),
        ...(params.birthday !== undefined && { birthday: params.birthday }),
        ...(params.notes !== undefined && { notes: params.notes }),
      },
    });
  }

  // ── Customer address book ─────────────────────────────────────────────────

  async listCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    const raw = await this.call<{ addresses: CustomerAddress[] }>({
      method: 'GET',
      path: `/v1/pos/customers/${customerId}/addresses`,
    });
    return raw.addresses;
  }

  async addCustomerAddress(customerId: string, params: AddressParams): Promise<CustomerAddress> {
    return this.call({
      method: 'POST',
      path: `/v1/pos/customers/${customerId}/addresses`,
      body: {
        line1: params.line1,
        city: params.city,
        postcode: params.postcode,
        ...(params.label !== undefined && { label: params.label }),
        ...(params.line2 !== undefined && { line2: params.line2 }),
        ...(params.state !== undefined && { state: params.state }),
        ...(params.country !== undefined && { country: params.country }),
        ...(params.isDefault !== undefined && { is_default: params.isDefault }),
      },
    });
  }

  async updateCustomerAddress(
    customerId: string,
    addressId: string,
    params: AddressParams,
  ): Promise<CustomerAddress> {
    return this.call({
      method: 'PUT',
      path: `/v1/pos/customers/${customerId}/addresses/${addressId}`,
      body: {
        line1: params.line1,
        city: params.city,
        postcode: params.postcode,
        ...(params.label !== undefined && { label: params.label }),
        ...(params.line2 !== undefined && { line2: params.line2 }),
        ...(params.state !== undefined && { state: params.state }),
        ...(params.country !== undefined && { country: params.country }),
        ...(params.isDefault !== undefined && { is_default: params.isDefault }),
      },
    });
  }

  async deleteCustomerAddress(customerId: string, addressId: string): Promise<void> {
    return this.call({
      method: 'DELETE',
      path: `/v1/pos/customers/${customerId}/addresses/${addressId}`,
    });
  }

  // ── Blog ──────────────────────────────────────────────────────────────────

  async listBlogPosts(opts: {
    status?: 'draft' | 'published';
    tag?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderingListResponse<BlogPost>> {
    return this.callList<BlogPost>(
      {
        method: 'GET',
        path: '/v1/pos/blog/posts',
        query: {
          status: opts.status,
          tag: opts.tag,
          limit: opts.limit ?? 20,
          offset: opts.offset ?? 0,
        },
      },
      'posts',
    );
  }

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const raw = await this.call<{ post?: BlogPost } | BlogPost>(
        { method: 'GET', path: `/v1/pos/blog/posts/${encodeURIComponent(slug)}` },
      );
      return ('post' in raw && raw.post) ? raw.post : raw as BlogPost;
    } catch {
      return null;
    }
  }

  async createBlogPost(params: CreateBlogPostParams): Promise<BlogPost> {
    const raw = await this.call<{ post?: BlogPost } | BlogPost>({
      method: 'POST',
      path: '/v1/pos/blog/posts',
      body: {
        title: params.title,
        body: params.body,
        ...(params.slug !== undefined && { slug: params.slug }),
        ...(params.excerpt !== undefined && { excerpt: params.excerpt }),
        ...(params.featuredImageUrl !== undefined && { featured_image_url: params.featuredImageUrl }),
        ...(params.tags !== undefined && { tags: params.tags }),
        ...(params.status !== undefined && { status: params.status }),
        ...(params.authorName !== undefined && { author_name: params.authorName }),
        ...(params.seoTitle !== undefined && { seo_title: params.seoTitle }),
        ...(params.seoDescription !== undefined && { seo_description: params.seoDescription }),
        ...(params.publishedAt !== undefined && { published_at: params.publishedAt }),
      },
    });
    return ('post' in raw && raw.post) ? raw.post : raw as BlogPost;
  }

  async updateBlogPost(slug: string, params: UpdateBlogPostParams): Promise<BlogPost> {
    const raw = await this.call<{ post?: BlogPost } | BlogPost>({
      method: 'PUT',
      path: `/v1/pos/blog/posts/${encodeURIComponent(slug)}`,
      body: {
        ...(params.title !== undefined && { title: params.title }),
        ...(params.body !== undefined && { body: params.body }),
        ...(params.slug !== undefined && { slug: params.slug }),
        ...(params.excerpt !== undefined && { excerpt: params.excerpt }),
        ...(params.featuredImageUrl !== undefined && { featured_image_url: params.featuredImageUrl }),
        ...(params.tags !== undefined && { tags: params.tags }),
        ...(params.status !== undefined && { status: params.status }),
        ...(params.authorName !== undefined && { author_name: params.authorName }),
        ...(params.seoTitle !== undefined && { seo_title: params.seoTitle }),
        ...(params.seoDescription !== undefined && { seo_description: params.seoDescription }),
        ...(params.publishedAt !== undefined && { published_at: params.publishedAt }),
      },
    });
    return ('post' in raw && raw.post) ? raw.post : raw as BlogPost;
  }

  async deleteBlogPost(slug: string): Promise<void> {
    return this.call({ method: 'DELETE', path: `/v1/pos/blog/posts/${encodeURIComponent(slug)}` });
  }

  // ── Custom pages ──────────────────────────────────────────────────────────

  async listCustomPages(opts: { isPublished?: boolean } = {}): Promise<OrderingListResponse<CustomPage>> {
    return this.callList<CustomPage>(
      {
        method: 'GET',
        path: '/v1/pos/pages',
        query: { is_published: opts.isPublished },
      },
      'pages',
    );
  }

  async getCustomPage(slug: string): Promise<CustomPage | null> {
    try {
      const raw = await this.call<{ page?: CustomPage } | CustomPage>(
        { method: 'GET', path: `/v1/pos/pages/${encodeURIComponent(slug)}` },
      );
      return ('page' in raw && raw.page) ? raw.page : raw as CustomPage;
    } catch {
      return null;
    }
  }

  async createCustomPage(params: CreateCustomPageParams): Promise<CustomPage> {
    const raw = await this.call<{ page?: CustomPage } | CustomPage>({
      method: 'POST',
      path: '/v1/pos/pages',
      body: {
        title: params.title,
        body: params.body,
        ...(params.slug !== undefined && { slug: params.slug }),
        ...(params.isPublished !== undefined && { is_published: params.isPublished }),
        ...(params.seoTitle !== undefined && { seo_title: params.seoTitle }),
        ...(params.seoDescription !== undefined && { seo_description: params.seoDescription }),
        ...(params.showInNav !== undefined && { show_in_nav: params.showInNav }),
        ...(params.showInFooter !== undefined && { show_in_footer: params.showInFooter }),
      },
    });
    return ('page' in raw && raw.page) ? raw.page : raw as CustomPage;
  }

  async updateCustomPage(slug: string, params: Partial<CreateCustomPageParams>): Promise<CustomPage> {
    const raw = await this.call<{ page?: CustomPage } | CustomPage>({
      method: 'PUT',
      path: `/v1/pos/pages/${encodeURIComponent(slug)}`,
      body: {
        ...(params.title !== undefined && { title: params.title }),
        ...(params.body !== undefined && { body: params.body }),
        ...(params.slug !== undefined && { slug: params.slug }),
        ...(params.isPublished !== undefined && { is_published: params.isPublished }),
        ...(params.seoTitle !== undefined && { seo_title: params.seoTitle }),
        ...(params.seoDescription !== undefined && { seo_description: params.seoDescription }),
        ...(params.showInNav !== undefined && { show_in_nav: params.showInNav }),
        ...(params.showInFooter !== undefined && { show_in_footer: params.showInFooter }),
      },
    });
    return ('page' in raw && raw.page) ? raw.page : raw as CustomPage;
  }

  async deleteCustomPage(slug: string): Promise<void> {
    return this.call({ method: 'DELETE', path: `/v1/pos/pages/${encodeURIComponent(slug)}` });
  }
}
