export { XebokiClient } from './client.js';
export type { XebokiClientOptions } from './client.js';
export { XebokiError } from './error.js';
export type { RateLimitInfo } from './error.js';

// Product clients
export { PosClient } from './products/pos.js';
export { ChatClient } from './products/chat.js';
export { LinkClient } from './products/link.js';
export { RemoveBGClient } from './products/removebg.js';
export { AnalyticsClient } from './products/analytics.js';
export { AccountClient } from './products/account.js';
export { LaunchpadClient } from './products/launchpad.js';
export { OrderingClient } from './products/ordering.js';
export { DeveloperClient } from './products/developer.js';

// POS types
export type {
  Order,
  OrderItem,
  CreateOrderParams,
  ListOrdersParams,
  Product,
  CreateProductParams,
  UpdateProductParams,
  ListProductsParams,
  InventoryItem,
  UpdateInventoryParams,
  Customer,
  CreateCustomerParams,
  ListCustomersParams,
  SalesReport,
  PosSession,
} from './products/pos.js';

// Chat types
export type {
  Conversation,
  CreateConversationParams,
  UpdateConversationParams,
  Message,
  SendMessageParams,
  Agent,
  CreateAgentParams,
  Contact,
  CreateContactParams,
  Inbox,
  ListConversationsParams,
} from './products/chat.js';

// Link types
export type {
  ShortLink,
  CreateLinkParams,
  UpdateLinkParams,
  ListLinksParams,
  LinkAnalytics,
} from './products/link.js';

// RemoveBG types
export type {
  ProcessImageParams,
  ProcessImageResult,
  QuotaInfo,
  BatchJob,
  CreateBatchParams,
} from './products/removebg.js';

// Analytics types
export type {
  Report,
  ReportData,
  ExportReportParams,
  ExportResult,
  ListReportsParams,
} from './products/analytics.js';

// Account types
export type {
  AccountProfile,
  UpdateProfileParams,
  AccountSubscription,
  AccountInvoice,
  PaymentMethod,
} from './products/account.js';

// Launchpad types
export type {
  LaunchpadCustomer,
  CreateLaunchpadCustomerParams,
  Subscription,
  CreateSubscriptionParams,
  Plan,
  LaunchpadInvoice,
  Coupon,
  CreateCouponParams,
  AnalyticsOverview,
  ListLaunchpadCustomersParams,
  ListSubscriptionsParams,
} from './products/launchpad.js';

// Ordering types
export type {
  OrderingCategory,
  ModifierOption,
  ModifierGroup,
  ProductVariant,
  VariantOption,
  OrderingProduct,
  OrderingCustomer,
  CustomerAuth,
  OrderingLineItem,
  OrderingOrder,
  DiscountValidation,
  OrderingAppointment,
  OrderingTable,
  OrderingStaff,
  OrderingListResponse,
  KeyValidationResult,
  OrderingFirebaseConfig,
  CreateOrderItem,
  CreateOrderingOrderParams,
  CreateAppointmentParams,
  StoreConfig,
  StorefrontConfig,
  UpdateStorefrontConfigParams,
  StripePaymentIntent,
  GiftCard,
  CustomerAddress,
  AddressParams,
  UpdateCustomerParams,
} from './products/ordering.js';

// Developer types
export type {
  ApiKey,
  CreatedApiKey,
  Webhook,
  CreateApiKeyParams,
  RegisterWebhookParams,
  TestWebhookParams,
} from './products/developer.js';
