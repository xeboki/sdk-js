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
  /** How many products sit in it. A menu wide enough to say so, says so. */
  productCount: number;
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
  shipping: number;
  loyaltyDiscount: number;
  total: number;
  paidTotal: number;
  items: OrderingLineItem[];
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  tableId: string | null;
  notes: string | null;
  reference: string | null;
  /**
   * Where it is going.
   *
   * Typed as a string, and the API has always sent an **object** for a
   * delivery order. So `{order.deliveryAddress}` in the shopper's order page
   * threw "Objects are not valid as a React child" and the page 500'd — for
   * every delivery order ever placed. It went unseen because the shops it
   * was tested against did collection only.
   *
   * Both shapes are accepted: a shop that stored one line of text keeps it.
   */
  deliveryAddress: string | DeliveryAddress | null;
  scheduledAt: string | null;
  createdAt: string;
  /**
   * The parcels, once the shop has sent any.
   *
   * The one thing a shopper opens their order page to find out, and the
   * mapper dropped it — an order could be shipped, with a carrier and a
   * tracking number recorded in the back office, and the shopper's own page
   * had no field to show it in. Voided parcels are already filtered out by
   * the API: the back office needs them for a support call, a shopper needs
   * the one that is actually coming.
   */
  shipments: OrderShipment[];
}

export interface DeliveryAddress {
  name?: string;
  company?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  [key: string]: string | undefined;
}

export interface OrderShipment {
  carrier: string;
  service: string;
  tracking: string;
  /** Blank when the courier has no tracking page — a shop's own van, say.
   *  A link that 404s reads as the shop having lost the order. */
  trackingUrl: string;
  shippedAt: string | null;
}

export interface DiscountValidation {
  valid: boolean;
  type: string | null;
  reason: string | null;
  value: number | null;
  discountAmount: number | null;

  /** Worth the delivery fee, not a sum off the goods.
   *
   * A checkout that adds this to `discountAmount` gives the shopper the offer
   * twice; it zeroes the shipping line instead. */
  freeShipping: boolean;
}

/** The offer a basket gets without the shopper typing anything.
 *
 * A shop can run "10% off everything this week" or "free delivery over
 * fifty" with no code at all. Advisory: the order endpoint resolves the same
 * rule again, because a saving a client asserts is a saving anybody can
 * assert. */
/** An offer the shop is running, for announcing rather than applying.
 *
 * Structured, not phrased: the wording belongs where the money is formatted
 * and the shop's language is known. */
export interface ShopOffer {
  id: string;
  name: string;
  /** Empty for an offer that applies itself. */
  code: string;
  kind: string;
  type: string;
  value: number;
  minOrderValue: number;
  minQuantity: number;
}

export interface AutomaticDiscount {
  applies: boolean;
  id?: string;
  name?: string;
  type?: string;
  value?: number;
  discountAmount?: number;
  freeShipping?: boolean;
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

export interface OrderReturn {
  returnId: string;
  orderId: string;
  status: string;               // requested|approved|rejected|received|refunded
  items: Array<{ productId: string; quantity: number; reason: string | null }>;
  reason: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LoyaltyConfig {
  pointsPerPound: number;
  redemptionThreshold: number;
  redemptionValue: number;
  enrollmentBonus: number;
  pointsExpiry: number;
}

export interface OrderingTable {
  id: string;
  name: string;
  status: string;
  capacity: number | null;
  section: string | null;
}

/** A location the merchant has enabled for online ordering. */
/** One day's trading hours. `closed` and empty times mean shut that day. */
export interface OpeningHours {
  opens: string;
  closes: string;
  closed: boolean;
}

export type Weekday =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday';

/** Only the days the merchant filled in — an absent day is "never said". */
export type WeeklyHours = Partial<Record<Weekday, OpeningHours>>;

export interface OrderingLocation {
  id: string;
  name: string;
  address: Record<string, unknown> | string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  currency: string | null;
  isActive: boolean;
  /** Null when the merchant has not set trading hours for this branch. */
  hours: WeeklyHours | null;
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

/** Public Firebase Web config for the tenant, used to run customer auth in a storefront. */
export interface FirestoreBrowserConfig {
  apiKey: string;
  appId: string;
  projectId: string;
  authDomain: string;
  messagingSenderId: string;
  storageBucket: string | null;
  measurementId: string | null;
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
  /** pickup | delivery | dine_in | takeaway — the API rejects anything else. */
  orderType: string;
  items: CreateOrderItem[];
  /**
   * Optional. Omit it and the API resolves the business's sole location;
   * a business with several locations must name one.
   */
  locationId?: string;
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
  /** Promo code applied to the goods before tax. */
  discountCode?: string;
  /** Gift card spent against the finished total. */
  giftCardCode?: string;
  /** Delivery/shipping charged on top of the goods. */
  shippingAmount?: number;
}

/** A buyer-facing payment method, from the merchant's single Payment Methods config. */
export interface StorePaymentMethod {
  /** Canonical method key, e.g. 'card' | 'cod' | 'gift_card'. */
  key: string;
  /** Display label (merchant's custom label, else a default). */
  label: string;
  /** Checkout flow to run: 'stripe' | 'paypal' | 'manual' (pay later / COD). */
  gateway: string;
  /** Display order shared with the POS checkout. */
  order: number;
}

export interface StoreConfig {
  businessType: string;
  /**
   * The name typed at signup. Often a legal or mistyped form — prefer
   * `displayName` on anything a customer sees.
   */
  businessName: string;
  /** The name a customer should be shown. Empty when never set. */
  displayName: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  taxLabel: string;
  taxRate: number;
  supportEmail: string;
  supportPhone: string;
  website: string;
  address: Record<string, unknown>;
  /**
   * Enabled online payment methods, in order — the single source shared with
   * the POS checkout (Payment Methods dialog). The storefront renders exactly
   * these; it hardcodes no payment method.
   */
  paymentMethods: StorePaymentMethod[];
}

/**
 * One entry in a shop's menu.
 *
 * `target` says what kind of thing it points at and `value` identifies it.
 * The address is NOT stored — the storefront knows its own routes, and a
 * stored URL would rot the first time one of them changed.
 */
export interface MenuItem {
  id: string;
  label: string;
  /**
   * catalog | category | categories | product | page | blog | book |
   * repairs | account | url | heading.
   *
   * `categories` means "all of them, live" — expanded when the page is drawn,
   * so a department added at the till appears without anybody editing a menu.
   * `heading` is a label with nowhere to go, which is what makes a mega
   * panel's columns readable.
   */
  target: string;
  /** The id, slug or address the target needs. Empty for the standalone ones. */
  value: string;
  /** One word beside the label — "NEW", "SALE". */
  badge: string;
  /** A picture, for a menu wide enough to show one. */
  imageUrl: string;
  openInNewTab: boolean;
  /**
   * How this entry's children are laid out when a full-width panel opens.
   * auto | column | tiles | strip. `auto` is a column when it holds links
   * and a picture when it holds a picture — what every menu did before this
   * was a choice.
   */
  display: string;
  children: MenuItem[];
}

export interface Navigation {
  /** The header's menu. Empty means the shop has never built one. */
  main: MenuItem[];
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

/**
 * One POS location as a storefront fulfillment point (city/location-based model).
 *
 * The storefront resolves a buyer's city to the branch that serves it and
 * charges that branch's delivery fee, offers its pickup point, and applies its
 * local tax. A city no branch serves falls back to the store-level defaults.
 */
export interface FulfillmentLocation {
  /**
   * Whether the merchant switched this branch on for online ordering. The
   * delivery/pickup flags describe HOW it would fulfil; this says whether it
   * is on the webshop at all. A storefront must not offer a branch that is
   * false here.
   */
  orderingEnabled: boolean;
  locationId: string;
  locationName: string;
  /** The branch's own city. */
  city: string;
  deliveryEnabled: boolean;
  deliveryFee: number;
  /** Subtotal at/above which this branch delivers free; null = never. */
  freeShippingThreshold: number | null;
  deliveryRadiusKm: number;
  minOrder: number;
  /** Cities/areas this branch delivers to (lowercased match at checkout). */
  servedCities: string[];
  pickupEnabled: boolean;
  pickupAddress: string;
  pickupInstructions: string;
  /** Local tax %, applied to orders this branch fulfills. */
  taxRate: number;
  /** Per-branch currency; null = store default. */
  currency: string | null;
  minDays: number;
  maxDays: number;
}

/** One promise in the reassurance band under the hero. */
export interface TrustItem {
  /** A name from the storefront's icon set; unknown names fall back. */
  icon: string;
  title: string;
  body: string;
}

/**
 * The words over one band of the home page.
 *
 * Every field is optional and a blank one keeps the storefront's own wording,
 * so retitling the featured band does not force a merchant to re-type the
 * eyebrow and the line under it.
 */
export interface SectionCopy {
  eyebrow?: string;
  title?: string;
  lede?: string;
  linkLabel?: string;
}

/**
 * One band of the home page, as the merchant arranged it.
 *
 * The page is a list they own — ordered, repeatable, and drawn from the
 * catalogue the API serves. An EMPTY list means they have arranged nothing
 * and the storefront draws the page it has always drawn; it does not mean an
 * empty page. Those have to stay different answers, or every shop that
 * predates the editor loses its home page on deploy.
 */
export interface HomeSection {
  id: string;
  type: string;
  variant: string;
  visible: boolean;
  /** eyebrow / title / lede / linkLabel, blank meaning the band's own words. */
  copy: Record<string, string>;
  /** Whatever this kind of band carries: pictures, a date, which courses. */
  settings: Record<string, unknown>;
}

/**
 * A row's columns, each a stack of blocks.
 *
 * Depth stops at one: a row may hold columns, a column may hold blocks, and a
 * block is never a row. Deeper than that is a grid engine rather than a shop
 * front — the API refuses it, and this type says so.
 */
export interface HomeColumn {
  blocks: HomeSection[];
}


export function mapHomeSections(raw: unknown): HomeSection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(row['id'] ?? `section-${index}`),
      type: String(row['type'] ?? ''),
      variant: String(row['variant'] ?? ''),
      visible: row['visible'] !== false,
      copy: (row['copy'] as Record<string, string>) ?? {},
      settings: (row['settings'] as Record<string, unknown>) ?? {},
    };
  }).filter((s) => s.type !== '');
}

/** Per-band wording, keyed by the same section ids `sections` uses. */
export type StorefrontSectionCopy = Record<string, SectionCopy>;

/**
 * How the shop's header is put together.
 *
 * Named variants rather than free measurements: a merchant who can set
 * anything can build a header with nothing in it. The API fills every field,
 * falling back on anything it does not recognise, so this is never partial.
 */
export interface HeaderSettings {
  /** on | off — whether the header carries search at all. */
  search: string;
  /** left | centre | right. Moot when the width is 'fill'. */
  searchPlacement: string;
  /** fill | small | medium | large. Named sizes, never measurements. */
  searchWidth: string;
  /** open = always a field | tap = an icon that opens into its space. */
  searchBehaviour: string;
  showCurrency: boolean;
  showLanguage: boolean;
  showLocation: boolean;
  showAccount: boolean;
  showWishlist: boolean;
  showCart: boolean;
  /** all | featured | off */
  categoryRail: string;
  /** Departments kept out of the rail without deactivating them. */
  hiddenCategoryIds: string[];
  /**
   * The header's arrangement, by name. One drawn layout per name.
   *
   * Supersedes `logoPosition`, which named four of them; the API reads a
   * stored `logo_position` and answers in `style`, so nothing here needs to
   * know it existed.
   */
  style: string;
  /** normal | upper — whether the department names shout. */
  linkCase: string;
  /** The hairline under the bar. */
  showBorder: boolean;
  /**
   * off | on — the thin band above the bar.
   *
   * On, it takes the store picker, the language and the currency out of the
   * bar. Those three are what crowd a centred layout, so this is what lets
   * one carry them at all.
   */
  utilityBar: string;
  /** A line in that band. */
  utilityMessage: string;
  /**
   * normal | slow | fast | off — how fast the band turns over.
   *
   * The band carries one line per live offer as well as the merchant's own,
   * and crossfades between them. Five seconds suits two short lines and is
   * not enough for five long ones, so the merchant sets the pace. `off`
   * leaves the strip still, with its arrows.
   */
  utilityRotate: string;
  /**
   * The shop's one important button, in the bar.
   *
   * Blank label means no button. It points at whatever a menu entry can
   * point at — the same question, so the same answers.
   */
  actionLabel: string;
  actionTarget: string;
  actionValue: string;
  /**
   * How the departments are presented on a wide screen.
   * rail = a scrolling row under the bar | inline = in the bar itself |
   * mega = one panel behind a trigger | drawer = a side panel.
   */
  menu: string;
  /** sheet | drawer | fullscreen — a phone is not a narrow desktop. */
  mobileMenu: string;
  /**
   * What the header does as the page moves under it.
   * condense | fixed | hide | static. Replaces the old `sticky` switch, which
   * the API still reads for any shop that set it.
   */
  scroll: string;
  /** solid | transparent | floating. */
  surface: string;
}

/**
 * `section_copy` both ways.
 *
 * Cast, not mapped, is the recurring bug in this file: it survives review for
 * every field whose two spellings happen to match, and `link_label` is not one
 * of them — a cast would have left every "View all" override silently dropped.
 */
function mapSectionCopy(raw: unknown): StorefrontSectionCopy {
  if (!raw || typeof raw !== 'object') return {};
  const out: StorefrontSectionCopy = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    out[key] = {
      eyebrow:   (v['eyebrow'] as string) ?? '',
      title:     (v['title'] as string) ?? '',
      lede:      (v['lede'] as string) ?? '',
      linkLabel: (v['link_label'] as string) ?? '',
    };
  }
  return out;
}

/**
 * `header_settings` both ways.
 *
 * Mapped field by field for the same reason `section_copy` is: `show_currency`
 * is not `showCurrency`, and a cast would leave every one of these reading
 * undefined — which is falsy, so a header would quietly lose its cart.
 */
/**
 * One banner in the slideshow.
 *
 * Every field is present on every slide — a component reading `slide.eyebrow`
 * must not get `undefined` on the slide where the merchant left it blank.
 */
export interface HeroSlide {
  /** Stable across reorders. The storefront keys its list on this; keyed on
   *  array position, a shopper's place moves when a slide above is deleted. */
  id: string;
  imageUrl: string;
  eyebrow: string;
  title: string;
  /** 'normal' | 'large' | 'xlarge' — Shopify's heading_size. */
  titleSize: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  /** 'left' | 'centre' | 'right' */
  align: string;
  /** 'top' | 'middle' | 'bottom' */
  vertical: string;
  /** The phone's own alignment; defaults to `align`. */
  alignMobile: string;
  /** 'none' | 'light' | 'medium' | 'heavy' — the scrim under the copy. */
  overlay: string;
  /** ISO 8601, or '' for always. A sale banner that takes itself down. */
  startsAt: string;
  endsAt: string;
}

/** How the banners are composed and how the shop moves between them. */
export interface HeroSlideshow {
  /** 'full' | 'split' | 'minimal' | 'carousel' */
  layout: string;
  /** 'slide' | 'fade' | 'carousel' */
  transition: string;
  /** 'none' | 'ambient' — what the picture does while a slide is up. */
  imageMotion: string;
  /** 'off' | 'slow' | 'normal' | 'fast' (9/5/3 seconds). */
  interval: string;
  /** 'dots' | 'counter' | 'numbers' | 'none' */
  indicator: string;
  arrows: boolean;
  /** 'adapt' | 'short' | 'medium' | 'tall' */
  height: string;
  /** 'over' | 'below' — where the copy sits on a phone. */
  mobileText: string;
  pauseOnHover: boolean;
  loop: boolean;
  /** The server's cap, carried so the back office keeps no copy of it. */
  maxSlides: number;
}

/** One choice a merchant can make, as the server words it. */
export interface BannerOption {
  key: string;
  label: string;
}

/**
 * Every banner option, per axis, in the order the server lists them.
 *
 * Served rather than kept in a client: a style added on the server reaches the
 * back office without a release, and no client can offer a name the server
 * would refuse.
 */
export type BannerOptions = Record<string, BannerOption[]>;

function mapBannerOptions(raw: unknown): BannerOptions {
  if (!raw || typeof raw !== 'object') return {};
  const out: BannerOptions = {};
  for (const [axis, options] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(options)) continue;
    const mapped = options
      .filter((o): o is Record<string, unknown> => Boolean(o) && typeof o === 'object')
      .map((o) => ({ key: String(o['key'] ?? ''), label: String(o['label'] ?? o['key'] ?? '') }))
      .filter((o) => o.key);
    if (mapped.length) out[axis] = mapped;
  }
  return out;
}

/** How long delivery takes, when the shop has said. */
export interface DeliveryEstimate {
  /** Null when the shop has never said — never an invented number. */
  minDays: number | null;
  maxDays: number | null;
  /** '12pm' | '2pm' | '4pm' | '6pm', or '' when there is no estimate. */
  cutoff: string;
}

function mapDeliveryEstimate(raw: unknown): DeliveryEstimate {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const days = (key: string) =>
    typeof v[key] === 'number' ? (v[key] as number) : null;
  return {
    minDays: days('min_days'),
    maxDays: days('max_days'),
    cutoff: (v['cutoff'] as string) ?? '',
  };
}

/** What a shop may load, and what it may report. */
export interface AnalyticsSettings {
  ga4: { enabled: boolean; measurementId: string };
  meta: {
    enabled: boolean;
    pixelId: string;
    trackPurchases: boolean;
    trackAddToCart: boolean;
  };
  gtm: { enabled: boolean; containerId: string };
}

function mapAnalytics(raw: unknown): AnalyticsSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const group = (key: string) =>
    (v[key] && typeof v[key] === 'object' ? v[key] : {}) as Record<string, unknown>;
  const ga4 = group('ga4');
  const meta = group('meta');
  const gtm = group('gtm');
  // Anything unreadable means OFF. A tag loaded because a field could not be
  // parsed is a shopper tracked by accident.
  return {
    ga4: { enabled: ga4['enabled'] === true, measurementId: (ga4['measurement_id'] as string) ?? '' },
    meta: {
      enabled: meta['enabled'] === true,
      pixelId: (meta['pixel_id'] as string) ?? '',
      trackPurchases: meta['track_purchases'] !== false,
      trackAddToCart: meta['track_add_to_cart'] !== false,
    },
    gtm: { enabled: gtm['enabled'] === true, containerId: (gtm['container_id'] as string) ?? '' },
  };
}

/** What a shop asks a shopper for at checkout. */
export interface CheckoutSettings {
  /** 'guest' | 'optional' | 'required' */
  accountMode: string;
  requirePhone: boolean;
  requireCompany: boolean;
  requireVat: boolean;
  requireDob: boolean;
  allowNotes: boolean;
  /** False unless there is also something to read. */
  showTerms: boolean;
  termsUrl: string;
  thankYouMessage: string;
  showTracking: boolean;
  showSocialShare: boolean;
}

/**
 * A blog post, in the shape the type promises.
 *
 * There was no mapper. `callList` casts the raw list `as T[]`, so `BlogPost`
 * claimed camelCase and the API answered snake_case — **every one of those
 * fields was undefined at runtime**. No post has ever shown its featured
 * image or its author, and the date rendered as "Invalid Date" on every
 * shop's blog index, because `publishedAt ?? createdAt` is undefined ??
 * undefined.
 *
 * A cast is not a mapping. The other resources here map; the blog was cast.
 */
/**
 * A booking, from what the endpoint actually sends.
 *
 * `_format_appointment` answers snake_case — `customer_id`, `service_name`,
 * `scheduled_at` — and the list method casts it, so every camelCase field
 * on a listed appointment is `undefined`. Reading one of those to decide
 * whether somebody may cancel a booking would compare `undefined` with a
 * customer id and refuse everybody, or, written the other way round, allow
 * everybody.
 */
function mapAppointment(raw: Record<string, unknown>): OrderingAppointment {
  const pick = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string' && value) return value;
    }
    return null;
  };
  return {
    id: pick('id') ?? '',
    status: pick('status') ?? 'pending',
    serviceId: pick('service_id', 'serviceId') ?? '',
    serviceName: pick('service_name', 'serviceName') ?? '',
    customerId: pick('customer_id', 'customerId'),
    customerName: pick('customer_name', 'customerName'),
    staffId: pick('staff_id', 'staffId'),
    staffName: pick('staff_name', 'staffName'),
    notes: pick('notes'),
    startTime: pick('scheduled_at', 'startTime', 'start_time') ?? '',
    durationMinutes: Number(raw['duration_minutes'] ?? raw['durationMinutes'] ?? 0),
  };
}

function mapBlogComment(raw: Record<string, unknown>): BlogComment {
  const text = (...keys: string[]): string | null => {
    for (const key of keys) {
      const value = raw[key];
      if (typeof value === 'string' && value) return value;
    }
    return null;
  };
  const comment: BlogComment = {
    id: text('id') ?? '',
    postId: text('post_id', 'postId'),
    parentId: text('parent_id', 'parentId'),
    authorName: text('author_name', 'authorName') ?? 'A customer',
    body: text('body') ?? '',
    status: (text('status') ?? 'pending') as BlogComment['status'],
    isShopReply: Boolean(raw['is_shop_reply'] ?? raw['isShopReply']),
    isPinned: Boolean(raw['is_pinned'] ?? raw['isPinned']),
    createdAt: text('created_at', 'createdAt'),
    depth: Number(raw['depth'] ?? 0),
  };
  // Only carried when the server sent them, so a public comment does not
  // acquire an `authorEmail: null` that looks like a missing address.
  if ('author_email' in raw) comment.authorEmail = text('author_email');
  if ('customer_id' in raw) comment.customerId = text('customer_id');
  if ('held_reason' in raw) comment.heldReason = text('held_reason');
  if ('post_title' in raw) comment.postTitle = text('post_title');
  if ('moderated_at' in raw) comment.moderatedAt = text('moderated_at');
  if ('report_count' in raw) comment.reportCount = Number(raw['report_count']);
  if ('author_history' in raw) comment.authorHistory = text('author_history');
  if ('author_is_new' in raw) comment.authorIsNew = Boolean(raw['author_is_new']);
  return comment;
}

function mapBlogPost(raw: Record<string, unknown>): BlogPost {
  const text = (key: string): string => (raw[key] as string) ?? '';
  const orNull = (key: string): string | null =>
    (raw[key] as string | null) ?? null;
  const status = raw['status'] === 'published' ? 'published' : 'draft';
  const seen = raw['visibility'];
  return {
    id:                raw['id'] as string,
    slug:              text('slug'),
    title:             text('title'),
    excerpt:           orNull('excerpt'),
    body:              text('body'),
    featuredImageUrl:  orNull('featured_image_url'),
    featuredImageAlt:  text('featured_image_alt'),
    tags:              (raw['tags'] as string[]) ?? [],
    status,
    authorName:        orNull('author_name'),
    seoTitle:          orNull('seo_title'),
    seoDescription:    orNull('seo_description'),
    publishedAt:       orNull('published_at'),
    createdAt:         text('created_at'),
    updatedAt:         text('updated_at'),
    categoryId:        orNull('category_id'),
    relatedProductIds: (raw['related_product_ids'] as string[]) ?? [],
    // Served by the API, which is the only place that can compare a publish
    // date with the clock. An older API that does not send it leaves a
    // published post live, which is what it was before scheduling existed.
    visibility: (seen === 'draft' || seen === 'scheduled' || seen === 'live')
      ? seen
      : (status === 'published' ? 'live' : 'draft'),
    readingMinutes:    Number(raw['reading_minutes'] ?? 0) || 0,
  };
}

function mapBlogCategory(raw: Record<string, unknown>): BlogCategory {
  return {
    id:          raw['id'] as string,
    slug:        (raw['slug'] as string) ?? '',
    name:        (raw['name'] as string) ?? '',
    description: (raw['description'] as string) ?? '',
    position:    Number(raw['position'] ?? 0) || 0,
    postCount:   Number(raw['post_count'] ?? 0) || 0,
  };
}


function mapCheckout(raw: unknown): CheckoutSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const bool = (key: string, fallback: boolean) =>
    typeof v[key] === 'boolean' ? (v[key] as boolean) : fallback;
  return {
    accountMode: (v['account_mode'] as string) || 'optional',
    requirePhone: bool('require_phone', false),
    requireCompany: bool('require_company', false),
    requireVat: bool('require_vat', false),
    requireDob: bool('require_dob', false),
    // The notes box and the tracking link exist today, so absent means on.
    allowNotes: bool('allow_notes', true),
    showTerms: bool('show_terms', false),
    termsUrl: (v['terms_url'] as string) || '',
    thankYouMessage: (v['thank_you_message'] as string) || '',
    showTracking: bool('show_tracking', true),
    showSocialShare: bool('show_social_share', false),
  };
}

/** The moving band above the header, and what a merchant decided about it. */
export interface Announcement {
  /** False when it is switched off, or when there is nothing to say. */
  enabled: boolean;
  text: string;
  /** `#rrggbb`, or empty for the shop's own brand colour. */
  background: string;
  /** Dark words, for a pale background a merchant chose. */
  darkText: boolean;
}

function mapAnnouncement(raw: unknown): Announcement {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    // Absent means shown: every shop with a band today predates these
    // settings, and reading this must not silently remove it.
    enabled: v['enabled'] !== false,
    text: (v['text'] as string) ?? '',
    background: (v['background'] as string) ?? '',
    darkText: v['dark_text'] === true,
  };
}

/** The notice a shop shows a first-time visitor. */
export interface PromoPopup {
  /** False unless the merchant switched it on AND gave it words to say. */
  enabled: boolean;
  title: string;
  message: string;
  /** Seconds after the page settles. The server clamps this. */
  delaySeconds: number;
  /** Once a visit, rather than on every page they open. */
  oncePerSession: boolean;
}

function mapPromoPopup(raw: unknown): PromoPopup {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    // A shop whose owner never opened that screen must not start interrupting
    // its visitors, so anything unreadable means off.
    enabled: v['enabled'] === true,
    title: (v['title'] as string) ?? '',
    message: (v['message'] as string) ?? '',
    delaySeconds: typeof v['delay_seconds'] === 'number' ? (v['delay_seconds'] as number) : 3,
    oncePerSession: v['once_per_session'] !== false,
  };
}

function mapHeroSlide(raw: unknown): HeroSlide {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (key: string, fallback = '') => (v[key] as string) ?? fallback;
  const align = str('align', 'left');
  return {
    id:               str('id'),
    imageUrl:         str('image_url'),
    eyebrow:          str('eyebrow'),
    title:            str('title'),
    titleSize:        str('title_size', 'large'),
    subtitle:         str('subtitle'),
    ctaText:          str('cta_text'),
    ctaUrl:           str('cta_url'),
    secondaryCtaText: str('secondary_cta_text'),
    secondaryCtaUrl:  str('secondary_cta_url'),
    align,
    vertical:         str('vertical', 'middle'),
    alignMobile:      str('align_mobile', align),
    overlay:          str('overlay', 'medium'),
    startsAt:         str('starts_at'),
    endsAt:           str('ends_at'),
  };
}

function unmapHeroSlide(slide: Partial<HeroSlide>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value;
  };
  put('id', slide.id);
  put('image_url', slide.imageUrl);
  put('eyebrow', slide.eyebrow);
  put('title', slide.title);
  put('title_size', slide.titleSize);
  put('subtitle', slide.subtitle);
  put('cta_text', slide.ctaText);
  put('cta_url', slide.ctaUrl);
  put('secondary_cta_text', slide.secondaryCtaText);
  put('secondary_cta_url', slide.secondaryCtaUrl);
  put('align', slide.align);
  put('vertical', slide.vertical);
  put('align_mobile', slide.alignMobile);
  put('overlay', slide.overlay);
  put('starts_at', slide.startsAt);
  put('ends_at', slide.endsAt);
  return out;
}

function mapHeroSlideshow(raw: unknown): HeroSlideshow {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const bool = (key: string, fallback: boolean) =>
    typeof v[key] === 'boolean' ? (v[key] as boolean) : fallback;
  return {
    layout:       (v['layout'] as string) || 'full',
    transition:   (v['transition'] as string) || 'slide',
    imageMotion:  (v['image_motion'] as string) || 'none',
    interval:     (v['interval'] as string) || 'normal',
    indicator:    (v['indicator'] as string) || 'dots',
    arrows:       bool('arrows', true),
    height:       (v['height'] as string) || 'adapt',
    mobileText:   (v['mobile_text'] as string) || 'over',
    pauseOnHover: bool('pause_on_hover', true),
    loop:         bool('loop', true),
    maxSlides:    typeof v['max_slides'] === 'number' ? (v['max_slides'] as number) : 8,
  };
}

function unmapHeroSlideshow(s: Partial<HeroSlideshow>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (key: string, value: unknown) => {
    if (value !== undefined) out[key] = value;
  };
  put('layout', s.layout);
  put('transition', s.transition);
  put('image_motion', s.imageMotion);
  put('interval', s.interval);
  put('indicator', s.indicator);
  put('arrows', s.arrows);
  put('height', s.height);
  put('mobile_text', s.mobileText);
  put('pause_on_hover', s.pauseOnHover);
  put('loop', s.loop);
  // max_slides is the server's, never sent back.
  return out;
}

function mapHeaderSettings(raw: unknown): HeaderSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const bool = (key: string, fallback: boolean) =>
    typeof v[key] === 'boolean' ? (v[key] as boolean) : fallback;
  return {
    search:            (v['search'] as string) || 'on',
    searchPlacement:   (v['search_placement'] as string) || 'centre',
    searchWidth:       (v['search_width'] as string) || 'fill',
    searchBehaviour:   (v['search_behaviour'] as string) || 'open',
    showCurrency:      bool('show_currency', false),
    showLanguage:      bool('show_language', true),
    showLocation:      bool('show_location', true),
    showAccount:       bool('show_account', true),
    showWishlist:      bool('show_wishlist', true),
    showCart:          bool('show_cart', true),
    categoryRail:      (v['category_rail'] as string) || 'all',
    hiddenCategoryIds: (v['hidden_category_ids'] as string[]) ?? [],
    style:             (v['style'] as string) || 'classic',
    linkCase:          (v['link_case'] as string) || 'upper',
    showBorder:        bool('show_border', true),
    utilityBar:        (v['utility_bar'] as string) || 'off',
    utilityMessage:    (v['utility_message'] as string) ?? '',
    utilityRotate:     (v['utility_rotate'] as string) || 'normal',
    actionLabel:       (v['action_label'] as string) ?? '',
    actionTarget:      (v['action_target'] as string) || 'catalog',
    actionValue:       (v['action_value'] as string) ?? '',
    menu:              (v['menu'] as string) || 'rail',
    mobileMenu:        (v['mobile_menu'] as string) || 'sheet',
    // `scroll` replaced the `sticky` switch. The API reads a stored `sticky`
    // and answers in `scroll`, so nothing here needs to know about it.
    scroll:            (v['scroll'] as string) || 'condense',
    surface:           (v['surface'] as string) || 'solid',
  };
}

/**
 * The menu tree, with every field present.
 *
 * Named rather than cast, for the reason the category list was: a cast says
 * the wire already uses these names and it does not — `image_url` and
 * `open_in_new_tab` would have been `undefined` on every item, and a badge
 * that is sometimes absent reads as a bug in the menu rather than in this.
 */
function mapMenuItems(raw: unknown): MenuItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v): MenuItem => {
    const item = (v ?? {}) as Record<string, unknown>;
    return {
      id:           (item['id'] as string) ?? '',
      label:        (item['label'] as string) ?? '',
      target:       (item['target'] as string) ?? 'heading',
      value:        (item['value'] as string) ?? '',
      badge:        (item['badge'] as string) ?? '',
      imageUrl:     (item['image_url'] as string) ?? '',
      openInNewTab: (item['open_in_new_tab'] as boolean) ?? false,
      display:      (item['display'] as string) ?? 'auto',
      children:     mapMenuItems(item['children']),
    };
  });
}

function mapNavigation(raw: unknown): Navigation {
  const nav = (raw ?? {}) as Record<string, unknown>;
  return { main: mapMenuItems(nav['main']) };
}

function unmapHeaderSettings(settings: Partial<HeaderSettings>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (settings.search !== undefined) out['search'] = settings.search;
  if (settings.searchPlacement !== undefined) out['search_placement'] = settings.searchPlacement;
  if (settings.searchWidth !== undefined) out['search_width'] = settings.searchWidth;
  if (settings.searchBehaviour !== undefined) out['search_behaviour'] = settings.searchBehaviour;
  if (settings.showCurrency !== undefined) out['show_currency'] = settings.showCurrency;
  if (settings.showLanguage !== undefined) out['show_language'] = settings.showLanguage;
  if (settings.showLocation !== undefined) out['show_location'] = settings.showLocation;
  if (settings.showAccount !== undefined) out['show_account'] = settings.showAccount;
  if (settings.showWishlist !== undefined) out['show_wishlist'] = settings.showWishlist;
  if (settings.showCart !== undefined) out['show_cart'] = settings.showCart;
  if (settings.categoryRail !== undefined) out['category_rail'] = settings.categoryRail;
  if (settings.hiddenCategoryIds !== undefined) out['hidden_category_ids'] = settings.hiddenCategoryIds;
  if (settings.style !== undefined) out['style'] = settings.style;
  if (settings.linkCase !== undefined) out['link_case'] = settings.linkCase;
  if (settings.showBorder !== undefined) out['show_border'] = settings.showBorder;
  if (settings.utilityBar !== undefined) out['utility_bar'] = settings.utilityBar;
  if (settings.utilityMessage !== undefined) out['utility_message'] = settings.utilityMessage;
  if (settings.utilityRotate !== undefined) out['utility_rotate'] = settings.utilityRotate;
  if (settings.actionLabel !== undefined) out['action_label'] = settings.actionLabel;
  if (settings.actionTarget !== undefined) out['action_target'] = settings.actionTarget;
  if (settings.actionValue !== undefined) out['action_value'] = settings.actionValue;
  if (settings.menu !== undefined) out['menu'] = settings.menu;
  if (settings.mobileMenu !== undefined) out['mobile_menu'] = settings.mobileMenu;
  if (settings.scroll !== undefined) out['scroll'] = settings.scroll;
  if (settings.surface !== undefined) out['surface'] = settings.surface;
  return out;
}

function unmapSectionCopy(copy: StorefrontSectionCopy): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(copy)) {
    out[key] = {
      eyebrow:    value.eyebrow ?? '',
      title:      value.title ?? '',
      lede:       value.lede ?? '',
      link_label: value.linkLabel ?? '',
    };
  }
  return out;
}

/**
 * Which bands the home page draws.
 *
 * A missing key means SHOWN. A storefront configured before this existed has
 * an empty map, and it must not lose half its page as a result.
 */
export type StorefrontSections = Record<string, boolean>;

export interface StorefrontConfig {
  storefrontSlug: string | null;
  isPublished: boolean;
  /** How the catalogue listing behaves. */
  catalogShowPrices: boolean;
  catalogShowStock: boolean;
  /** '' means the listing's own order. */
  catalogDefaultSort: string;
  catalogPerPage: number;
  /** There is a home page saved but not published. */
  homeSectionsHasDraft: boolean;
  /** `homeSections` on THIS response is that unpublished page. */
  homeSectionsIsPreview: boolean;
  /** Theme preset id the storefront paints from — 'classic' | 'modern' | 'warm' | 'minimal' | 'bold' | 'vibrant'. */
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  /** Body font family. Empty = the preset's own. */
  font: string;
  /** Heading font family. Empty = falls back to `font`, then the preset's. */
  headingFont: string | null;
  /**
   * The face the shop's NAME is set in when it has no logo.
   * Blank falls through to the heading face, which is what it always used.
   */
  wordmarkFont: string | null;
  /** A line under the mark, drawn by the layouts with a row deep enough. */
  wordmarkTagline: string;
  /**
   * The merchant's page background. Empty = the preset's own — and it is
   * empty unless they switched the picker on, because the Design screen
   * shipped that field pre-filled with a colour nobody chose.
   */
  backgroundColor: string;
  backgroundCustom: boolean;
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  heroTitle: string;
  heroSubtitle: string;
  /** The hero's primary button. Blank = "Shop now" to the catalog. */
  heroCtaText: string;
  heroCtaUrl: string;
  /** The hero's second button. A blank label hides it. */
  heroSecondaryCtaText: string;
  heroSecondaryCtaUrl: string;
  featuredCategoryIds: string[];
  featuredProductIds: string[];
  announcementBar: string | null;
  /** Band visibility. Absent key = shown. */
  sections: StorefrontSections;
  /** The home page the merchant arranged. Empty = the page it always drew. */
  homeSections: HomeSection[];
  /** Overrides the preset's hero treatment: banner | split | minimal. */
  heroStyle: string;
  /** The banner module. EMPTY means this shop composes one banner from the
   *  `hero*` fields above, which is what every shop predating it does. */
  heroSlides: HeroSlide[];
  heroSlideshow: HeroSlideshow;
  /** What a banner may be set to, per axis. The server's list, never a copy. */
  bannerOptions: BannerOptions;
  /** The notice shown to a first-time visitor. */
  promoPopup: PromoPopup;
  /** The moving band above the header. */
  announcement: Announcement;
  /**
   * What a shop says that is not its brand — success, warning, danger, info.
   * Absent means the conventional green, amber, red and blue.
   */
  stateColors: Record<string, string>;
  /**
   * How the type is set — a scale, a base size, a heading weight, a tracking,
   * and whether labels are uppercase. Relationships, never pixel boxes.
   */
  typography: Record<string, string>;
  /**
   * Whether the shop is taking orders at all. Absent means yes.
   * Enforced on the server too — a switch honoured only in the buttons is not
   * a switch, because a stale tab still orders.
   */
  acceptOnlineOrders: boolean;
  /** What the shop asks for at checkout. */
  checkout: CheckoutSettings;
  /** What may be loaded and what may be reported. */
  analytics: AnalyticsSettings;
  /** How long delivery takes, when the shop has said. */
  deliveryEstimate: DeliveryEstimate;
  /** False hides sold-out products from the catalogue. Absent means shown. */
  showOutOfStock: boolean;
  /** True puts the whole shop behind a sign-in. Absent means open. */
  requireLoginToBrowse: boolean;
  /** Empty = the storefront's own, derived from the merchant's shipping rules. */
  trustItems: TrustItem[];
  /** Per-band wording. A blank field falls back to the storefront's own. */
  sectionCopy: StorefrontSectionCopy;
  headerSettings: HeaderSettings;
  /** A line under the store name in the footer. Empty = none. */
  /**
   * The statutory age statement for a shop that sells alcohol.
   * Shown by the storefront in the shell, on every page — not as a
   * home-page band, which is a list a merchant can empty.
   */
  ageNotice: string;
  footerTagline: string;
  footerShowSocial: boolean;
  footerShowAddress: boolean;
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
  /** The header's menu, as a tree the merchant owns. */
  navigation: Navigation;
  /** Footer columns with custom links */
  footerColumns: FooterColumn[];
  socialLinks: Record<string, string>;
  customDomain: string | null;
  /** Whether the merchant charges for delivery (else pickup/free only). */
  shippingEnabled: boolean;
  /** Flat delivery fee applied to delivery orders. */
  shippingFlatRate: number;
  /** Order subtotal at/above which delivery is free; null = never. */
  freeShippingThreshold: number | null;
  /** GA4 Measurement ID (G-XXXX) for this store, if set. */
  ga4MeasurementId: string | null;
  /** Meta (Facebook) Pixel ID for this store, if set. */
  metaPixelId: string | null;
  // ── Multi-location fulfillment (city/location-based) ──
  /** Store currency (ISO code), e.g. 'GBP'. Null = deployment default. */
  defaultCurrency: string | null;
  /** Whether displayed prices already include tax. */
  taxInclusive: boolean;
  /** Fallback tax % for a city no branch serves. */
  defaultTaxRate: number;
  /** Fallback delivery fee for a city no branch serves. */
  defaultDeliveryFee: number;
  /** POS locations configured as fulfillment points. */
  fulfillmentLocations: FulfillmentLocation[];
  /**
   * How buyers browse the catalog across online stores:
   * 'unified' (one merged catalog, fulfilling store chosen at checkout) or
   * 'location_first' (pick a store, see its own available in-stock catalog).
   */
  catalogMode: string;
  updatedAt: string | null;
}

export interface UpdateStorefrontConfigParams {
  storefrontSlug?: string;
  isPublished?: boolean;
  theme?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  headingFont?: string;
  wordmarkFont?: string;
  wordmarkTagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  heroImageUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaUrl?: string;
  heroSecondaryCtaText?: string;
  heroSecondaryCtaUrl?: string;
  featuredCategoryIds?: string[];
  featuredProductIds?: string[];
  announcementBar?: string;
  sections?: StorefrontSections;
  homeSections?: HomeSection[];
  heroStyle?: string;
  /** A list is replaced wholesale, so send every slide to be kept. */
  heroSlides?: Partial<HeroSlide>[];
  heroSlideshow?: Partial<HeroSlideshow>;
  stateColors?: Record<string, string>;
  typography?: Record<string, string>;
  acceptOnlineOrders?: boolean;
  trustItems?: TrustItem[];
  sectionCopy?: StorefrontSectionCopy;
  headerSettings?: Partial<HeaderSettings>;
  backgroundColor?: string;
  backgroundCustom?: boolean;
  ageNotice?: string;
  footerTagline?: string;
  footerShowSocial?: boolean;
  footerShowAddress?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoTitleTemplate?: string;
  seoOgImageUrl?: string;
  googleVerificationCode?: string;
  structuredDataEnabled?: boolean;
  navLinks?: NavLink[];
  navigation?: Navigation;
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
  /** When it goes live. May be in the FUTURE — a scheduled post. */
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** What the featured image shows. Shopify models alt on an article image. */
  featuredImageAlt: string;
  /** The curated grouping, as distinct from tags. */
  categoryId: string | null;
  /** Products this post is about. */
  relatedProductIds: string[];
  /**
   * draft | scheduled | live.
   *
   * Derived by the server, never stored — `status` alone cannot tell a post
   * that is live from one written for next Tuesday.
   */
  visibility: 'draft' | 'scheduled' | 'live';
  /** 0 when there is no body; "do not show it" rather than "a minute". */
  readingMinutes: number;
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  position: number;
  /** Public posts only, so a category of drafts reads as empty. */
  postCount: number;
}

/** A reader's reply to a post. Approved ones only, on the public list. */
export interface BlogComment {
  id: string;
  postId: string | null;
  /** The comment this answers, or null. Threading is one level deep. */
  parentId: string | null;
  /** Never an email address, and never blank. */
  authorName: string;
  body: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  /** The shop answering, rather than another customer. */
  isShopReply: boolean;
  /** The shop saying "read this one". At most one per post; it leads. */
  isPinned: boolean;
  /** How many readers have raised it. Merchant-only. */
  reportCount?: number;
  /** "3 published · 1 marked spam", or "First comment here". Merchant-only. */
  authorHistory?: string | null;
  authorIsNew?: boolean;
  createdAt: string | null;
  /** 0 for a comment, 1 for a reply. The server flattens anything deeper. */
  depth: number;
  // ── Merchant-only. Absent on the public list, deliberately: published
  //    beside a comment, the addresses are a scrapeable address book.
  authorEmail?: string | null;
  customerId?: string | null;
  /** Why a filter held it — "3 links", "blocked word: casino". */
  heldReason?: string | null;
  postTitle?: string | null;
  moderatedAt?: string | null;
}

/** What a post's comment section needs before anybody types. */
export interface BlogCommentThread {
  comments: BlogComment[];
  total: number;
  /** False when the shop has comments off, or the post has closed. */
  isOpen: boolean;
  /** Why it closed, when it did. Null when comments are simply not a
   *  feature here — "Comments are closed" with no reason reads as a fault. */
  closedReason: string | null;
  allowGuests: boolean;
  /** True when a new comment waits to be read rather than appearing. */
  moderated: boolean;
  /** Which order the thread came back in. */
  sort: 'oldest' | 'newest';
  /** False when the shop has turned reader reporting off; draw no control. */
  canReport: boolean;
}

/** What happened to a comment somebody just left. */
export interface BlogCommentOutcome {
  comment: BlogComment;
  status: BlogComment['status'];
  /** Ready to show. A held comment is not an error. */
  message: string;
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

/**
 * The API answers in snake_case; CustomPage is camelCase.
 *
 * Both readers used to CAST the raw body instead of mapping it, so
 * `isPublished` was always undefined — and `/p/[slug]` refuses to render a
 * page that is not published. Every custom page on every storefront 404'd,
 * however carefully a merchant wrote it. Same mismatch as _mapProduct and
 * listLocations; this is the third reader it has caught out.
 */
function _mapCustomPage(raw: Record<string, unknown>): CustomPage {
  return {
    id:             (raw.id as string) ?? '',
    slug:           (raw.slug as string) ?? '',
    title:          (raw.title as string) ?? '',
    body:           (raw.body as string) ?? '',
    isPublished:    (raw.is_published as boolean) ?? false,
    seoTitle:       (raw.seo_title as string | null) ?? null,
    seoDescription: (raw.seo_description as string | null) ?? null,
    showInNav:      (raw.show_in_nav as boolean) ?? false,
    showInFooter:   (raw.show_in_footer as boolean) ?? false,
    sortOrder:      Number(raw.sort_order ?? 0),
    publishAt:      (raw.publish_at as string | null) ?? null,
    ogImageUrl:     (raw.og_image_url as string | null) ?? null,
    formerSlugs:    ((raw.former_slugs as string[]) ?? []),
    visibility:     ((raw.visibility as string) ?? 'draft') as CustomPage['visibility'],
    wordCount:      Number(raw.word_count ?? 0),
    readingMinutes: Number(raw.reading_minutes ?? 0),
    createdAt:      (raw.created_at as string) ?? '',
    updatedAt:      (raw.updated_at as string) ?? '',
  };
}

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
  /** Where the merchant dragged it in the CMS list. */
  sortOrder: number;
  /** When it goes live. May be in the FUTURE — a scheduled page. */
  publishAt: string | null;
  /** What a link to this page looks like when it is shared. */
  ogImageUrl: string | null;
  /** Every address it has ever had. The shop redirects the old ones. */
  formerSlugs: string[];
  /** draft | scheduled | live. Derived by the server, never stored. */
  visibility: 'draft' | 'scheduled' | 'live';
  wordCount: number;
  readingMinutes: number;
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


/** A scheduled group class customers can book a place in. */
export interface OrderingClassSession {
  id: string;
  locationId: string;
  serviceId: string;
  serviceName: string;
  description?: string;
  staffId?: string;
  staffName?: string;
  /** ISO date, e.g. "2026-08-10". */
  sessionDate: string;
  /** "HH:mm". */
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  /** Never negative, even if a counter has drifted. */
  placesLeft: number;
  price: number;
  status: string;
  /** False for a sold-out or cancelled class — do not offer a Book button. */
  isBookable: boolean;
}

export interface BookClassParams {
  /** Omit for a guest booking. Two guests are two people, not one. */
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  /** External booking id. Passing it twice returns the first booking. */
  reference?: string;
}

export interface ClassBookingResult {
  appointmentId: string;
  classSessionId: string;
  status: string;
  serviceName: string;
  price: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  placesLeft: number;
  /** True when a retry matched an earlier booking rather than making one. */
  idempotent?: boolean;
}

export interface CreateAppointmentParams {
  customerId: string;
  serviceId: string;
  staffId?: string;
  /** ISO-8601 datetime the appointment starts, e.g. "2026-04-15T10:00:00Z". */
  startTime: string;
  durationMinutes?: number;
  notes?: string;
  /**
   * Which location the booking belongs to.
   *
   * Optional: a key scoped to exactly one location has already answered this,
   * which is the case for a storefront. Required only when the key permits
   * several, since an appointment stored against no location is invisible to
   * every screen in the till — they all query by location first.
   */
  locationId?: string;
  /** External booking id. Passing it twice returns the first booking. */
  reference?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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

  /**
   * Transport-only passthrough — returns the gateway response UNMAPPED. For a
   * BFF that forwards verbatim to its own clients (so a mobile app keeps its
   * existing gateway-shaped parsers). The caller supplies the full, correct
   * path (e.g. '/v1/pos/catalog'); auth, first-party headers and identity
   * encoding are still applied by the HTTP layer.
   */
  async raw<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    opts: { query?: Record<string, string | number | boolean | undefined>; body?: unknown } = {},
  ): Promise<T> {
    return this.call<T>({ method, path, query: opts.query, body: opts.body });
  }

  private async callList<T>(
    opts: Parameters<HttpClient['request']>[0],
    key: string,
  ): Promise<OrderingListResponse<T>> {
    const res = await this.http.request<Record<string, unknown>>(opts);
    this.onRateLimit(res.rateLimit);
    const raw = res.data;
    const list = (Array.isArray(raw) ? raw : ((raw[key] ?? raw['data'] ?? []) as unknown[])) as T[];
    // Some endpoints nest counts under `pagination` (e.g. /catalog); read it so
    // callers get a real total for page controls instead of just this page's length.
    const pg = (raw['pagination'] as Record<string, unknown> | undefined) ?? {};
    const perPage = (raw['limit'] ?? pg['per_page']) as number | undefined;
    const page = pg['page'] as number | undefined;
    return {
      data: list,
      total: (raw['total'] ?? pg['total']) as number | undefined ?? list.length,
      limit: perPage ?? 50,
      offset: page && perPage ? (page - 1) * perPage : ((raw['offset'] as number | undefined) ?? 0),
    };
  }

  /**
   * The catalog API answers in snake_case; OrderingProduct is camelCase. Without
   * this every consumer read `undefined` for isActive, imageUrl, hasVariants and
   * the rest — the storefront showed every product as "Sold Out" (missing
   * isActive) with no image or add button.
   */
  private _mapProduct(raw: Record<string, unknown>): OrderingProduct {
    const num = (v: unknown): number => {
      const n = typeof v === 'string' ? parseFloat(v) : (v as number);
      return Number.isFinite(n) ? n : 0;
    };
    const variants = (raw['variants'] as Array<Record<string, unknown>> | undefined) ?? [];
    const groups   = (raw['modifier_groups'] as Array<Record<string, unknown>> | undefined) ?? [];
    return {
      id:            raw['id'] as string,
      name:          (raw['name'] as string) ?? '',
      price:         num(raw['price']),
      // The catalog list is pre-filtered to active products and omits the flag;
      // the detail endpoint sends is_active. Default true so a missing field
      // never reads as "sold out".
      isActive:      (raw['is_active'] as boolean | undefined) ?? true,
      trackInventory:(raw['track_inventory'] as boolean | undefined) ?? false,
      description:   (raw['description'] as string | null) ?? null,
      imageUrl:      (raw['image_url'] as string | null) ?? null,
      categoryId:    (raw['category_id'] as string | null) ?? null,
      categoryName:  (raw['category_name'] as string | null) ?? null,
      stockQuantity:
        raw['stock'] != null ? num(raw['stock'])
        : raw['stock_quantity'] != null ? num(raw['stock_quantity'])
        : null,
      hasVariants:   (raw['has_variants'] as boolean | undefined) ?? false,
      variantOptions:(raw['variant_options'] as VariantOption[] | undefined) ?? [],
      variants: variants.map((v) => ({
        id:             v['id'] as string,
        label:          (v['label'] as string) ?? '',
        attributes:     (v['attributes'] as Record<string, string>) ?? {},
        sku:            (v['sku'] as string | null) ?? null,
        barcode:        (v['barcode'] as string | null) ?? null,
        imageUrl:       (v['image_url'] as string | null) ?? null,
        price:          v['price'] == null ? null : num(v['price']),
        compareAtPrice: v['compare_at_price'] == null ? null : num(v['compare_at_price']),
        stock:          num(v['stock']),
        stockByLocation:(v['stock_by_location'] as Record<string, number>) ?? {},
        sortOrder:      num(v['sort_order']),
      })),
      modifierGroups: groups.map((g) => ({
        id:            g['id'] as string,
        name:          (g['name'] as string) ?? '',
        required:      (g['required'] as boolean) ?? false,
        minSelections: (g['min_selections'] as number | null) ?? null,
        maxSelections: (g['max_selections'] as number | null) ?? null,
        options: (((g['modifiers'] as Array<Record<string, unknown>> | undefined) ?? []).map((o) => ({
          id:              o['id'] as string,
          name:            (o['name'] as string) ?? '',
          priceAdjustment: num(o['price_adjustment']),
          isAvailable:     (o['is_active'] as boolean | undefined) ?? true,
        }))),
      })),
      tags: (raw['tags'] as string[] | null) ?? [],
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
    type FirebaseConfigShape = {
      api_key: string;
      project_id: string;
      app_id: string;
      auth_domain: string;
      storage_bucket: string;
      messaging_sender_id: string;
    };
    const raw = await this.call<{
      firebase_config?: FirebaseConfigShape;
      custom_token?: string;
    }>({ method: 'GET', path: '/v1/pos/firebase-config' });
    // The endpoint returns the config nested under `firebase_config` on some
    // deployments and flat at the top level on others. The previous cast named
    // an optional type (so it included `undefined`) and would not compile.
    const cfg = raw.firebase_config ?? (raw as unknown as FirebaseConfigShape);
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
    const res = await this.callList<Record<string, unknown>>(
      // API serves the list at /categories; /catalog/categories matched the
      // single-product route (/catalog/{id}) and 404'd "Product not found".
      { method: 'GET', path: '/v1/pos/categories', query: { location_id: opts.locationId } },
      'categories',
    );
    // This list used to be cast straight to the type, which meant `sortOrder`
    // and `isActive` were named for fields the wire does not have and were
    // `undefined` on every category ever returned. Nothing read them, so it
    // never showed — map the names rather than assert them.
    return {
      ...res,
      data: res.data.map((raw): OrderingCategory => ({
        id:           (raw['id'] as string) ?? '',
        name:         (raw['name'] as string) ?? '',
        icon:         (raw['icon'] as string | null) ?? null,
        color:        (raw['color'] as string | null) ?? null,
        sortOrder:    Number(raw['sort_order']) || 0,
        isActive:     (raw['is_active'] as boolean | undefined) ?? true,
        productCount: Number(raw['product_count']) || 0,
      })),
    };
  }

  async listProducts(opts: {
    categoryId?: string;
    search?: string;
    locationId?: string;
    inStockOnly?: boolean;
    sort?: 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest';
    minPrice?: number;
    maxPrice?: number;
    /** Particular products, for a page that links to them by id. */
    ids?: string[];
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderingListResponse<OrderingProduct>> {
    const res = await this.callList<Record<string, unknown>>(
      {
        method: 'GET',
        // API serves the list at /catalog; /catalog/products matched the
        // single-product route (/catalog/{id}) and 404'd. It paginates by
        // page/per_page, not limit/offset.
        path: '/v1/pos/catalog',
        query: {
          ids: opts.ids?.length ? opts.ids.join(',') : undefined,
          category_id: opts.categoryId,
          search: opts.search,
          ...(opts.inStockOnly ? { in_stock_only: true } : {}),
          ...(opts.sort ? { sort: opts.sort } : {}),
          ...(opts.minPrice !== undefined ? { min_price: opts.minPrice } : {}),
          ...(opts.maxPrice !== undefined ? { max_price: opts.maxPrice } : {}),
          // Location-first browsing: scope stock + availability to one store.
          ...(opts.locationId ? { location_id: opts.locationId } : {}),
          per_page: opts.limit ?? 40,
          page:
            opts.offset && opts.limit
              ? Math.floor(opts.offset / opts.limit) + 1
              : 1,
        },
      },
      'products',
    );
    return { ...res, data: res.data.map((p) => this._mapProduct(p)) };
  }

  /** [locationId] scopes stock to one store, matching listProducts(). */
  async getProduct(id: string, locationId?: string): Promise<OrderingProduct> {
    const raw = await this.call<Record<string, unknown>>(
      {
        method: 'GET',
        path: `/v1/pos/catalog/${id}`,
        query: locationId ? { location_id: locationId } : undefined,
      },
    );
    const body = ('product' in raw && raw.product ? raw.product : raw) as Record<string, unknown>;
    return this._mapProduct(body);
  }

  // ── Customer auth ───────────────────────────────────────────────────────────

  /**
   * Public (client-safe) Firebase config for the merchant's tenant project.
   * A storefront initialises the Firebase Web SDK with this to run customer
   * auth (createUser / signIn) against the tenant's own Firebase Auth.
   */
  async getFirestoreConfig(): Promise<FirestoreBrowserConfig> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'GET',
      path: '/v1/pos/firestore-config',
    });
    return {
      apiKey:            (raw['api_key'] as string) ?? '',
      appId:             (raw['app_id'] as string) ?? '',
      projectId:         (raw['project_id'] as string) ?? '',
      authDomain:        (raw['auth_domain'] as string) ?? '',
      messagingSenderId: (raw['messaging_sender_id'] as string) ?? '',
      storageBucket:     (raw['storage_bucket'] as string | null) ?? null,
      measurementId:     (raw['measurement_id'] as string | null) ?? null,
    };
  }

  private _mapCustomerAuth(raw: Record<string, unknown>): CustomerAuth {
    const c = (raw['customer'] as Record<string, unknown>) ?? {};
    const num = (v: unknown): number => {
      const n = typeof v === 'string' ? parseFloat(v) : (v as number);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      token: (raw['token'] as string) ?? '',
      customer: {
        id:            (c['id'] as string) ?? '',
        name:          (c['name'] as string) ?? (c['full_name'] as string) ?? '',
        email:         (c['email'] as string | null) ?? null,
        phone:         (c['phone'] as string | null) ?? null,
        storeCredit:   num(c['store_credit'] ?? c['storeCredit']),
        loyaltyPoints: num(c['loyalty_points'] ?? c['loyaltyPoints']),
      },
    };
  }

  /**
   * Customer auth is Firebase-based: the client signs in against the tenant's
   * Firebase Auth and exchanges the resulting ID token here for a Xeboki
   * customer session. (There is no email/password endpoint — passwords live in
   * Firebase, never in this API.)
   */
  async verifyCustomerToken(idToken: string): Promise<CustomerAuth> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: '/v1/pos/customers/firebase-verify',
      body: { id_token: idToken },
    });
    return this._mapCustomerAuth(raw);
  }

  /** Creates the customer record from a freshly-registered Firebase user. */
  async registerCustomerToken(params: {
    idToken: string;
    fullName?: string;
    phone?: string;
  }): Promise<OrderingCustomer> {
    const raw = await this.call<{ customer?: Record<string, unknown> } | Record<string, unknown>>({
      method: 'POST',
      path: '/v1/pos/customers/firebase-register',
      body: {
        id_token: params.idToken,
        ...(params.fullName !== undefined && { full_name: params.fullName }),
        ...(params.phone !== undefined && { phone: params.phone }),
      },
    });
    const c = (('customer' in raw && raw.customer) ? raw.customer : raw) as Record<string, unknown>;
    const num = (v: unknown): number => {
      const n = typeof v === 'string' ? parseFloat(v) : (v as number);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      id:            (c['id'] as string) ?? '',
      name:          (c['name'] as string) ?? (c['full_name'] as string) ?? '',
      email:         (c['email'] as string | null) ?? null,
      phone:         (c['phone'] as string | null) ?? null,
      storeCredit:   num(c['store_credit'] ?? c['storeCredit']),
      loyaltyPoints: num(c['loyalty_points'] ?? c['loyaltyPoints']),
    };
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
    opts: { orderTotal?: number; locationId?: string; quantity?: number } = {},
  ): Promise<DiscountValidation> {
    // The endpoint answers in snake_case like the rest of the API; this used to
    // return the raw body, so `discountAmount` was always undefined.
    const raw = await this.call<{
      valid: boolean;
      reason: string | null;
      type: string | null;
      value: number | null;
      discount_amount: number | null;
      free_shipping?: boolean;
    }>({
      method: 'POST',
      path: '/v1/pos/discounts/validate',
      body: {
        code,
        ...(opts.orderTotal !== undefined && { order_total: opts.orderTotal }),
        ...(opts.locationId !== undefined && { location_id: opts.locationId }),
        // A promotion with a minimum item count cannot be judged without it.
        ...(opts.quantity !== undefined && { quantity: opts.quantity }),
      },
    });
    return {
      valid: raw.valid,
      type: raw.type ?? null,
      reason: raw.reason ?? null,
      value: raw.value ?? null,
      discountAmount: raw.discount_amount ?? null,
      freeShipping: raw.free_shipping ?? false,
    };
  }

  /** Everything the shop is running, for the storefront to announce.
   *
   * Only what is genuinely live — paused, unstarted, expired and used-up are
   * left out by the API, so a strip built from this cannot advertise
   * something a shopper would then be refused. */
  async listOffers(): Promise<ShopOffer[]> {
    const raw = await this.call<{ offers?: Array<Record<string, unknown>> }>({
      method: 'GET',
      path: '/v1/pos/offers',
    });
    return (raw.offers ?? []).map((o) => ({
      id: String(o.id ?? ''),
      name: String(o.name ?? ''),
      code: String(o.code ?? ''),
      kind: String(o.kind ?? 'code'),
      type: String(o.type ?? 'percentage'),
      value: Number(o.value ?? 0),
      minOrderValue: Number(o.min_order_value ?? 0),
      minQuantity: Number(o.min_quantity ?? 0),
    }));
  }

  /** The offer this basket gets with no code typed, if the shop runs one. */
  async automaticDiscount(
    opts: { orderTotal?: number; quantity?: number; shippingAmount?: number } = {},
  ): Promise<AutomaticDiscount> {
    const raw = await this.call<{
      applies: boolean;
      id?: string;
      name?: string;
      type?: string;
      value?: number;
      discount_amount?: number;
      free_shipping?: boolean;
    }>({
      method: 'POST',
      path: '/v1/pos/discounts/automatic',
      body: {
        ...(opts.orderTotal !== undefined && { order_total: opts.orderTotal }),
        ...(opts.quantity !== undefined && { quantity: opts.quantity }),
        ...(opts.shippingAmount !== undefined && {
          shipping_amount: opts.shippingAmount,
        }),
      },
    });
    if (!raw.applies) return { applies: false };
    return {
      applies: true,
      id: raw.id,
      name: raw.name,
      type: raw.type,
      value: raw.value,
      discountAmount: raw.discount_amount ?? 0,
      freeShipping: raw.free_shipping ?? false,
    };
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  async listOrders(opts: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderingListResponse<OrderingOrder>> {
    const res = await this.callList<Record<string, unknown>>(
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
    return { ...res, data: res.data.map((o) => this._mapOrder(o)) };
  }

  async getOrder(id: string): Promise<OrderingOrder> {
    const raw = await this.call<Record<string, unknown>>(
      { method: 'GET', path: `/v1/pos/orders/${id}` },
    );
    const body = ('order' in raw && raw.order ? raw.order : raw) as Record<string, unknown>;
    return this._mapOrder(body);
  }

  async createOrder(params: CreateOrderingOrderParams): Promise<OrderingOrder> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: '/v1/pos/orders',
      body: {
        order_type: params.orderType,
        // The API's OrderItemIn is snake_case (product_id, variant_id). Passing
        // the camelCase params straight through sent {productId,...}, which
        // Pydantic rejected as a missing product_id — every order 422'd.
        items: params.items.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
          ...(it.variantId !== undefined && { variant_id: it.variantId }),
          ...(it.modifiers !== undefined && { modifiers: it.modifiers }),
          ...(it.notes !== undefined && { notes: it.notes }),
        })),
        ...(params.locationId !== undefined && { location_id: params.locationId }),
        ...(params.customerId !== undefined && { customer_id: params.customerId }),
        ...(params.guestName !== undefined && { guest_name: params.guestName }),
        ...(params.guestEmail !== undefined && { guest_email: params.guestEmail }),
        ...(params.notes !== undefined && { notes: params.notes }),
        ...(params.tableId !== undefined && { table_number: params.tableId }),
        ...(params.scheduledAt !== undefined && { scheduled_at: params.scheduledAt }),
        ...(params.deliveryAddress !== undefined && { delivery_address: params.deliveryAddress }),
        ...(params.idempotencyKey !== undefined && { idempotency_key: params.idempotencyKey }),
        ...(params.loyaltyPointsRedeemed !== undefined && params.loyaltyPointsRedeemed > 0 && {
          loyalty_points_redeemed: params.loyaltyPointsRedeemed,
        }),
        ...(params.discountCode !== undefined && { discount_code: params.discountCode }),
        ...(params.giftCardCode !== undefined && { gift_card_code: params.giftCardCode }),
        ...(params.shippingAmount !== undefined && { shipping_amount: params.shippingAmount }),
      },
    });
    // The create response is snake_case and nests nothing: order_id, not id.
    // Returning it raw left order.id undefined, so the storefront redirected to
    // /orders/undefined even though the order was created.
    const body = ('order' in raw && raw.order ? raw.order : raw) as Record<string, unknown>;
    return this._mapOrder(body);
  }

  /** Maps the API's snake_case order shape to OrderingOrder. */
  private _mapOrder(raw: Record<string, unknown>): OrderingOrder {
    const num = (v: unknown): number => {
      const n = typeof v === 'string' ? parseFloat(v) : (v as number);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      id:              (raw['id'] as string) ?? (raw['order_id'] as string) ?? '',
      orderNumber:     (raw['order_number'] as string) ?? (raw['orderNumber'] as string) ?? '',
      status:          (raw['status'] as string) ?? '',
      orderType:       (raw['order_type'] as string) ?? (raw['orderType'] as string) ?? '',
      subtotal:        num(raw['subtotal']),
      tax:             num(raw['tax']),
      discount:        num(raw['discount'] ?? raw['discounts']),
      shipping:        num(raw['shipping']),
      loyaltyDiscount: num(raw['loyalty_discount']),
      total:           num(raw['total']),
      paidTotal:       num(raw['paid_total'] ?? raw['paidTotal']),
      items:           ((raw['items'] as Array<Record<string, unknown>> | undefined) ?? []).map((it) => {
        const mods = (it['modifiers'] as Array<Record<string, unknown>> | undefined) ?? [];
        return {
          productId:         (it['product_id'] as string) ?? (it['productId'] as string) ?? '',
          variantId:         (it['variant_id'] as string | null) ?? null,
          variantLabel:      (it['variant_label'] as string | null) ?? null,
          variantAttributes: (it['variant_attributes'] as Record<string, string> | null) ?? null,
          productName:       (it['product_name'] as string) ?? (it['productName'] as string) ?? '',
          quantity:          num(it['quantity']),
          unitPrice:         num(it['unit_price'] ?? it['unitPrice']),
          totalPrice:        num(it['total_price'] ?? it['totalPrice']),
          // The type wants a list of names; the API stores modifier objects.
          // Default to [] so consumers can read .length without a guard.
          modifierNames:     mods.map((m) => (m['name'] as string) ?? '').filter(Boolean),
          notes:             (it['notes'] as string | null) ?? null,
        };
      }),
      customerId:      (raw['customer_id'] as string | null) ?? null,
      customerName:    (raw['customer_name'] as string | null) ?? (raw['guest_name'] as string | null) ?? null,
      customerEmail:   (raw['customer_email'] as string | null) ?? (raw['guest_email'] as string | null) ?? null,
      tableId:         (raw['table_number'] as string | null) ?? (raw['table_id'] as string | null) ?? null,
      notes:           (raw['notes'] as string | null) ?? null,
      reference:       (raw['external_reference'] as string | null) ?? (raw['reference'] as string | null) ?? null,
      deliveryAddress: (raw['delivery_address'] as string | DeliveryAddress | null) ?? null,
      scheduledAt:     (raw['scheduled_at'] as string | null) ?? null,
      createdAt:       (raw['created_at'] as string) ?? (raw['createdAt'] as string) ?? '',
      shipments:       ((raw['shipments'] as Array<Record<string, unknown>>) ?? [])
        .map((s) => ({
          carrier:     (s['carrier'] as string) ?? '',
          service:     (s['service'] as string) ?? '',
          tracking:    (s['tracking'] as string) ?? '',
          trackingUrl: (s['tracking_url'] as string) ?? '',
          shippedAt:   (s['shipped_at'] as string | null) ?? null,
        })),
    };
  }

  async payOrder(
    id: string,
    params: { method: string; amount: number; reference?: string },
  ): Promise<OrderingOrder> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/orders/${id}/pay`,
      body: {
        method: params.method,
        amount: params.amount,
        ...(params.reference !== undefined && { reference: params.reference }),
      },
    });
    const body = ('order' in raw && raw.order ? raw.order : raw) as Record<string, unknown>;
    // Falls back to the id we paid against — the pay response may echo only a
    // status, and the caller still needs the order id to redirect.
    if (body['id'] === undefined && body['order_id'] === undefined) body['id'] = id;
    return this._mapOrder(body);
  }

  // ── Tables ──────────────────────────────────────────────────────────────────

  async listTables(opts: { locationId?: string; status?: string } = {}): Promise<OrderingListResponse<OrderingTable>> {
    return this.callList<OrderingTable>(
      { method: 'GET', path: '/v1/pos/tables', query: { location_id: opts.locationId, status: opts.status } },
      'tables',
    );
  }

  /**
   * Locations the merchant has enabled for online ordering. This is the API's
   * own "single source of truth" for where a storefront order can be fulfilled
   * — a headless client should not hard-code a location id.
   */
  async listLocations(): Promise<OrderingListResponse<OrderingLocation>> {
    // Mapped rather than cast: the endpoint answers in snake_case, so a plain
    // cast left `isActive` undefined on every location — the same mismatch that
    // once showed every product as Sold Out. See _mapProduct.
    const res = await this.callList<Record<string, unknown>>(
      { method: 'GET', path: '/v1/pos/locations' },
      'locations',
    );
    return {
      ...res,
      data: res.data.map((raw): OrderingLocation => ({
        id:       (raw['id'] as string) ?? '',
        name:     (raw['name'] as string) ?? '',
        address:  (raw['address'] as Record<string, unknown> | string | null) ?? null,
        phone:    (raw['phone'] as string | null) ?? null,
        email:    (raw['email'] as string | null) ?? null,
        timezone: (raw['timezone'] as string | null) ?? null,
        currency: (raw['currency'] as string | null) ?? null,
        isActive: (raw['is_active'] as boolean) ?? true,
        hours:    (raw['hours'] as WeeklyHours | null) ?? null,
      })),
    };
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
    ).then((res) => ({ ...res, data: res.data.map(
      (row) => mapAppointment(row as unknown as Record<string, unknown>)) }));
  }

  // ── Group classes ───────────────────────────────────────────────────────────

  /**
   * Bookable group classes, soonest first.
   *
   * Past and cancelled sessions are never returned. Full ones are excluded
   * unless `includeFull` is set, which is how a storefront shows a class as
   * sold out rather than pretending it does not exist.
   */
  async listClasses(
    opts: { locationId?: string; limit?: number; includeFull?: boolean } = {},
  ): Promise<OrderingListResponse<OrderingClassSession>> {
    const raw = await this.call<{ classes?: Record<string, unknown>[]; count?: number }>({
      method: 'GET',
      path: '/v1/pos/classes',
      query: {
        location_id: opts.locationId,
        limit: opts.limit,
        ...(opts.includeFull !== undefined && { include_full: opts.includeFull }),
      },
    });
    const data = (raw.classes ?? []).map((c) => ({
      id: c['id'] as string,
      locationId: c['location_id'] as string,
      serviceId: c['service_id'] as string,
      serviceName: c['service_name'] as string,
      description: c['description'] as string | undefined,
      staffId: c['staff_id'] as string | undefined,
      staffName: c['staff_name'] as string | undefined,
      sessionDate: c['session_date'] as string,
      startTime: c['start_time'] as string,
      endTime: c['end_time'] as string,
      capacity: c['capacity'] as number,
      bookedCount: c['booked_count'] as number,
      placesLeft: c['places_left'] as number,
      price: c['price'] as number,
      status: c['status'] as string,
      isBookable: c['is_bookable'] as boolean,
    }));
    return {
      data,
      total: raw.count ?? data.length,
      limit: opts.limit ?? 50,
      offset: 0,
    };
  }

  /**
   * Claims one place in a class.
   *
   * The place is claimed atomically server-side, so two customers clicking
   * Book on the last one cannot both succeed — the loser gets a 409 rather
   * than a place that does not exist. A customer already in the class gets a
   * 409 too; a duplicate would take a seat from somebody else and bill them
   * twice.
   */
  async bookClass(sessionId: string, params: BookClassParams = {}): Promise<ClassBookingResult> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/classes/${sessionId}/book`,
      body: {
        ...(params.customerId !== undefined && { customer_id: params.customerId }),
        ...(params.customerName !== undefined && { customer_name: params.customerName }),
        ...(params.customerEmail !== undefined && { customer_email: params.customerEmail }),
        ...(params.customerPhone !== undefined && { customer_phone: params.customerPhone }),
        ...(params.notes !== undefined && { notes: params.notes }),
        ...(params.reference !== undefined && { reference: params.reference }),
      },
    });
    return {
      appointmentId: raw['appointment_id'] as string,
      classSessionId: raw['class_session_id'] as string,
      status: raw['status'] as string,
      serviceName: raw['service_name'] as string,
      price: (raw['price'] as number) ?? 0,
      sessionDate: raw['session_date'] as string,
      startTime: raw['start_time'] as string,
      endTime: raw['end_time'] as string,
      placesLeft: (raw['places_left'] as number) ?? 0,
      ...(raw['idempotent'] !== undefined && { idempotent: raw['idempotent'] as boolean }),
    };
  }

  async createAppointment(params: CreateAppointmentParams): Promise<OrderingAppointment> {
    const raw = await this.call<{ appointment?: OrderingAppointment } | OrderingAppointment>({
      method: 'POST',
      path: '/v1/pos/appointments',
      body: {
        customer_id: params.customerId,
        service_id: params.serviceId,
        // `scheduled_at`, not `start_time`. The endpoint has always taken
        // scheduled_at and never had a start_time field, so every call this
        // method made was rejected at validation — online booking did not
        // half-work, it had never worked.
        scheduled_at: params.startTime,
        duration_minutes: params.durationMinutes ?? 60,
        ...(params.locationId !== undefined && { location_id: params.locationId }),
        ...(params.staffId !== undefined && { staff_id: params.staffId }),
        ...(params.notes !== undefined && { notes: params.notes }),
        ...(params.reference !== undefined && { reference: params.reference }),
        ...(params.customerName !== undefined && { customer_name: params.customerName }),
        ...(params.customerEmail !== undefined && { customer_email: params.customerEmail }),
        ...(params.customerPhone !== undefined && { customer_phone: params.customerPhone }),
      },
    });
    return ('appointment' in raw && raw.appointment) ? raw.appointment : raw as OrderingAppointment;
  }

  /**
   * One booking, by id.
   *
   * Added because the storefront had no way to ask *whose* booking an id
   * belongs to. Its cancel route checked that somebody was signed in and
   * then passed the id straight through, so any shopper could cancel a
   * stranger's appointment — the check the order page has always had.
   *
   * Mapped, not cast. The endpoint answers snake_case; `listAppointments`
   * casts the same shape `as OrderingAppointment[]`, which is why
   * `customerId` reads `undefined` on every row it returns. Same fault the
   * blog had before it was given a mapper.
   */
  async getAppointment(id: string): Promise<OrderingAppointment> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'GET',
      path: `/v1/pos/appointments/${encodeURIComponent(id)}`,
    });
    return mapAppointment((raw['appointment'] ?? raw) as Record<string, unknown>);
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
      displayName:    (raw['display_name'] as string) ?? '',
      currencyCode:   raw['currency_code'] as string,
      currencySymbol: raw['currency_symbol'] as string,
      timezone:       raw['timezone'] as string,
      taxLabel:       raw['tax_label'] as string,
      taxRate:        raw['tax_rate'] as number,
      supportEmail:   raw['support_email'] as string,
      supportPhone:   raw['support_phone'] as string,
      website:        raw['website'] as string,
      address:        (raw['address'] ?? {}) as Record<string, unknown>,
      paymentMethods: ((raw['payment_methods'] as Record<string, unknown>[]) ?? [])
        .map((m) => ({
          key:     (m['key'] as string) ?? '',
          label:   (m['label'] as string) ?? '',
          gateway: (m['gateway'] as string) ?? 'manual',
          order:   (m['order'] as number) ?? 0,
        })),
    };
  }

  /**
   * Ecommerce storefront theme, colors, hero, featured collections, SEO defaults.
   *
   * With `previewToken`, the home page comes back as the merchant is working
   * on it rather than as the public sees it. Everything else is identical —
   * which is the point of putting it here rather than fetching the preview
   * separately: a caller that mapped the preview response itself would be a
   * second copy of the mapping below, and it would show the right bands with
   * every other setting fallen back to a default.
   */
  async getStorefrontConfig(options?: { previewToken?: string }): Promise<StorefrontConfig> {
    const query = options?.previewToken
      ? `?preview_token=${encodeURIComponent(options.previewToken)}`
      : '';
    const raw = await this.call<Record<string, unknown>>({ method: 'GET', path: `/v1/pos/storefront-config${query}` });
    return {
      // Whether there is unpublished work, and whether THIS is it. A
      // preview that cannot say it is a preview is how somebody ships a
      // half-finished page believing they already had.
      // Absent means today's shop: prices shown, stock counts not, the
      // listing's own order, 24 to a page.
      catalogShowPrices:       (raw['catalog_show_prices'] as boolean) ?? true,
      catalogShowStock:        (raw['catalog_show_stock'] as boolean) ?? false,
      catalogDefaultSort:      (raw['catalog_default_sort'] as string) ?? '',
      catalogPerPage:          (raw['catalog_per_page'] as number) ?? 24,
      homeSectionsHasDraft:    (raw['home_sections_has_draft'] as boolean) ?? false,
      homeSectionsIsPreview:   (raw['home_sections_is_preview'] as boolean) ?? false,
      storefrontSlug:          (raw['storefront_slug'] as string | null) ?? null,
      isPublished:             (raw['is_published'] as boolean) ?? false,
      theme:                   (raw['theme'] as string) ?? 'classic',
      primaryColor:            (raw['primary_color'] as string) ?? '#000000',
      secondaryColor:          (raw['secondary_color'] as string) ?? '#ffffff',
      font:                    (raw['font'] as string) ?? 'inter',
      headingFont:             (raw['heading_font'] as string | null) ?? null,
      wordmarkFont:            (raw['wordmark_font'] as string | null) ?? null,
      wordmarkTagline:         (raw['wordmark_tagline'] as string) ?? '',
      backgroundColor:         (raw['background_color'] as string) ?? '',
      backgroundCustom:        (raw['background_custom'] as boolean) ?? false,
      logoUrl:                 (raw['logo_url'] as string | null) ?? null,
      faviconUrl:              (raw['favicon_url'] as string | null) ?? null,
      heroImageUrl:            (raw['hero_image_url'] as string | null) ?? null,
      heroTitle:               (raw['hero_title'] as string) ?? '',
      heroSubtitle:            (raw['hero_subtitle'] as string) ?? '',
      heroCtaText:             (raw['hero_cta_text'] as string) ?? '',
      heroCtaUrl:              (raw['hero_cta_url'] as string) ?? '',
      heroSecondaryCtaText:    (raw['hero_secondary_cta_text'] as string) ?? '',
      heroSecondaryCtaUrl:     (raw['hero_secondary_cta_url'] as string) ?? '',
      featuredCategoryIds:     (raw['featured_category_ids'] as string[]) ?? [],
      featuredProductIds:      (raw['featured_product_ids'] as string[]) ?? [],
      announcementBar:         (raw['announcement_bar'] as string | null) ?? null,
      sections:                (raw['sections'] as StorefrontSections) ?? {},
      homeSections:            mapHomeSections(raw['home_sections']),
      heroStyle:               (raw['hero_style'] as string) ?? '',
      heroSlides:              ((raw['hero_slides'] as unknown[]) ?? []).map(mapHeroSlide),
      heroSlideshow:           mapHeroSlideshow(raw['hero_slideshow']),
      bannerOptions:           mapBannerOptions(raw['banner_options']),
      promoPopup:              mapPromoPopup(raw['promo_popup']),
      announcement:            mapAnnouncement(raw['announcement']),
      stateColors:             (raw['state_colors'] as Record<string, string>) ?? {},
      typography:              (raw['typography'] as Record<string, string>) ?? {},
      acceptOnlineOrders:      raw['accept_online_orders'] !== false,
      checkout:                mapCheckout(raw['checkout']),
      analytics:               mapAnalytics(raw['analytics']),
      deliveryEstimate:        mapDeliveryEstimate(raw['delivery_estimate']),
      showOutOfStock:          raw['show_out_of_stock'] !== false,
      requireLoginToBrowse:    raw['require_login_to_browse'] === true,
      trustItems:              (raw['trust_items'] as TrustItem[]) ?? [],
      sectionCopy:             mapSectionCopy(raw['section_copy']),
      headerSettings:          mapHeaderSettings(raw['header_settings']),
      ageNotice:               (raw['age_notice'] as string) ?? '',
      footerTagline:           (raw['footer_tagline'] as string) ?? '',
      footerShowSocial:        (raw['footer_show_social'] as boolean) ?? true,
      footerShowAddress:       (raw['footer_show_address'] as boolean) ?? true,
      seoTitle:                (raw['seo_title'] as string) ?? '',
      seoDescription:          (raw['seo_description'] as string) ?? '',
      seoTitleTemplate:        (raw['seo_title_template'] as string | null) ?? null,
      seoOgImageUrl:           (raw['seo_og_image_url'] as string | null) ?? null,
      googleVerificationCode:  (raw['google_verification_code'] as string | null) ?? null,
      structuredDataEnabled:   (raw['structured_data_enabled'] as boolean) ?? false,
      navLinks:                (raw['nav_links'] as NavLink[]) ?? [],
      navigation:              mapNavigation(raw['navigation']),
      footerColumns:           (raw['footer_columns'] as FooterColumn[]) ?? [],
      socialLinks:             (raw['social_links'] as Record<string, string>) ?? {},
      customDomain:            (raw['custom_domain'] as string | null) ?? null,
      shippingEnabled:         (raw['shipping_enabled'] as boolean) ?? false,
      shippingFlatRate:        (raw['shipping_flat_rate'] as number) ?? 0,
      freeShippingThreshold:   (raw['free_shipping_threshold'] as number | null) ?? null,
      ga4MeasurementId:        (raw['ga4_measurement_id'] as string | null) ?? null,
      metaPixelId:             (raw['meta_pixel_id'] as string | null) ?? null,
      defaultCurrency:         (raw['default_currency'] as string | null) ?? null,
      taxInclusive:            (raw['tax_inclusive'] as boolean) ?? false,
      defaultTaxRate:          (raw['default_tax_rate'] as number) ?? 0,
      defaultDeliveryFee:      (raw['default_delivery_fee'] as number) ?? 0,
      fulfillmentLocations:    ((raw['fulfillment_locations'] as Record<string, unknown>[]) ?? [])
        .map((l) => ({
          locationId:            (l['location_id'] as string) ?? '',
          locationName:          (l['location_name'] as string) ?? '',
          city:                  (l['city'] as string) ?? '',
          deliveryEnabled:       (l['delivery_enabled'] as boolean) ?? true,
          deliveryFee:           (l['delivery_fee'] as number) ?? 0,
          freeShippingThreshold: (l['free_shipping_threshold'] as number | null) ?? null,
          deliveryRadiusKm:      (l['delivery_radius_km'] as number) ?? 0,
          minOrder:              (l['min_order'] as number) ?? 0,
          servedCities:          (l['served_cities'] as string[]) ?? [],
          orderingEnabled:       (l['ordering_enabled'] as boolean) ?? true,
          pickupEnabled:         (l['pickup_enabled'] as boolean) ?? true,
          pickupAddress:         (l['pickup_address'] as string) ?? '',
          pickupInstructions:    (l['pickup_instructions'] as string) ?? '',
          taxRate:               (l['tax_rate'] as number) ?? 0,
          currency:              (l['currency'] as string | null) ?? null,
          minDays:               (l['min_days'] as number) ?? 1,
          maxDays:               (l['max_days'] as number) ?? 3,
        })),
      catalogMode:             (raw['catalog_mode'] as string) ?? 'unified',
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
        ...(params.headingFont !== undefined && { heading_font: params.headingFont }),
        ...(params.wordmarkFont !== undefined && { wordmark_font: params.wordmarkFont }),
        ...(params.wordmarkTagline !== undefined && { wordmark_tagline: params.wordmarkTagline }),
        ...(params.backgroundColor !== undefined && { background_color: params.backgroundColor }),
        ...(params.backgroundCustom !== undefined && { background_custom: params.backgroundCustom }),
        ...(params.logoUrl !== undefined && { logo_url: params.logoUrl }),
        ...(params.faviconUrl !== undefined && { favicon_url: params.faviconUrl }),
        ...(params.heroImageUrl !== undefined && { hero_image_url: params.heroImageUrl }),
        ...(params.heroTitle !== undefined && { hero_title: params.heroTitle }),
        ...(params.heroSubtitle !== undefined && { hero_subtitle: params.heroSubtitle }),
        ...(params.heroCtaText !== undefined && { hero_cta_text: params.heroCtaText }),
        ...(params.heroCtaUrl !== undefined && { hero_cta_url: params.heroCtaUrl }),
        ...(params.heroSecondaryCtaText !== undefined && { hero_secondary_cta_text: params.heroSecondaryCtaText }),
        ...(params.heroSecondaryCtaUrl !== undefined && { hero_secondary_cta_url: params.heroSecondaryCtaUrl }),
        ...(params.featuredCategoryIds !== undefined && { featured_category_ids: params.featuredCategoryIds }),
        ...(params.featuredProductIds !== undefined && { featured_product_ids: params.featuredProductIds }),
        ...(params.announcementBar !== undefined && { announcement_bar: params.announcementBar }),
        ...(params.sections !== undefined && { sections: params.sections }),
        ...(params.heroStyle !== undefined && { hero_style: params.heroStyle }),
        ...(params.heroSlides !== undefined && {
          hero_slides: params.heroSlides.map(unmapHeroSlide),
        }),
        ...(params.heroSlideshow !== undefined && {
          hero_slideshow: unmapHeroSlideshow(params.heroSlideshow),
        }),
        ...(params.trustItems !== undefined && { trust_items: params.trustItems }),
        ...(params.sectionCopy !== undefined && { section_copy: unmapSectionCopy(params.sectionCopy) }),
        ...(params.headerSettings !== undefined && { header_settings: unmapHeaderSettings(params.headerSettings) }),
        ...(params.ageNotice !== undefined && { age_notice: params.ageNotice }),
        ...(params.footerTagline !== undefined && { footer_tagline: params.footerTagline }),
        ...(params.footerShowSocial !== undefined && { footer_show_social: params.footerShowSocial }),
        ...(params.footerShowAddress !== undefined && { footer_show_address: params.footerShowAddress }),
        ...(params.seoTitle !== undefined && { seo_title: params.seoTitle }),
        ...(params.seoDescription !== undefined && { seo_description: params.seoDescription }),
        ...(params.seoTitleTemplate !== undefined && { seo_title_template: params.seoTitleTemplate }),
        ...(params.seoOgImageUrl !== undefined && { seo_og_image_url: params.seoOgImageUrl }),
        ...(params.googleVerificationCode !== undefined && { google_verification_code: params.googleVerificationCode }),
        ...(params.structuredDataEnabled !== undefined && { structured_data_enabled: params.structuredDataEnabled }),
        ...(params.navLinks !== undefined && { nav_links: params.navLinks }),
        ...(params.navigation !== undefined && { navigation: params.navigation }),
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
  /** [locationId] scopes stock to one store, matching listProducts(). */
  async getProductBySlug(slug: string, locationId?: string): Promise<OrderingProduct | null> {
    try {
      const raw = await this.call<Record<string, unknown>>({
        method: 'GET',
        path: `/v1/pos/catalog/slug/${encodeURIComponent(slug)}`,
        query: locationId ? { location_id: locationId } : undefined,
      });
      const body = ('product' in raw && raw.product ? raw.product : raw) as Record<string, unknown>;
      return this._mapProduct(body);
    } catch {
      return null;
    }
  }

  /**
   * Recommended add-on products for the given cart/product ids. Powers the
   * "you might also like" block on a product or cart page.
   */
  async listUpsells(productIds: string[]): Promise<OrderingProduct[]> {
    if (productIds.length === 0) return [];
    const raw = await this.call<{ products?: Array<Record<string, unknown>> }>({
      method: 'GET',
      path: '/v1/pos/catalog/upsells',
      query: { product_ids: productIds.join(',') },
    });
    return (raw.products ?? []).map((p) => this._mapProduct(p));
  }

  /** The tenant's loyalty conversion rules (points → currency). */
  async getLoyaltyConfig(): Promise<LoyaltyConfig> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'GET',
      path: '/v1/pos/loyalty/config',
    });
    const num = (v: unknown): number => {
      const n = typeof v === 'string' ? parseFloat(v) : (v as number);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      pointsPerPound:      num(raw['points_per_pound']),
      redemptionThreshold: num(raw['redemption_threshold']),
      redemptionValue:     num(raw['redemption_value']),
      enrollmentBonus:     num(raw['enrollment_bonus']),
      pointsExpiry:        num(raw['points_expiry']),
    };
  }

  // ── Delivery, meal deals, discounts (list) ────────────────────────────────
  // Lean proxies for secondary storefront/mobile features; callers map the
  // returned records to their own view models.

  async listMealDeals(opts: { locationId?: string } = {}): Promise<Array<Record<string, unknown>>> {
    const raw = await this.call<{ deals?: unknown[]; meal_deals?: unknown[] }>({
      method: 'GET', path: '/v1/pos/meal-deals', query: { location_id: opts.locationId },
    });
    return ((raw.deals ?? raw.meal_deals ?? []) as Array<Record<string, unknown>>);
  }

  async getDeliveryZones(opts: { locationId?: string } = {}): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>({
      method: 'GET', path: '/v1/pos/delivery/zones', query: { location_id: opts.locationId },
    });
  }

  async validatePostcode(postcode: string, opts: { locationId?: string } = {}): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>({
      method: 'POST', path: '/v1/pos/delivery/validate-postcode',
      body: { postcode, ...(opts.locationId !== undefined && { location_id: opts.locationId }) },
    });
  }

  async getDeliveryTracking(orderId: string): Promise<Record<string, unknown>> {
    return this.call<Record<string, unknown>>({
      method: 'GET', path: `/v1/pos/orders/${orderId}/delivery/tracking`,
    });
  }

  async listDiscounts(opts: { code?: string } = {}): Promise<Array<Record<string, unknown>>> {
    const raw = await this.call<{ discounts?: unknown[] }>({
      method: 'GET', path: '/v1/pos/discounts', query: { code: opts.code },
    });
    return ((raw.discounts ?? []) as Array<Record<string, unknown>>);
  }

  // ── Abandoned carts ───────────────────────────────────────────────────────

  async captureAbandonedCart(params: {
    email: string;
    items?: Array<Record<string, unknown>>;
    cartTotal?: number;
  }): Promise<{ cartId: string }> {
    const raw = await this.call<{ cart_id?: string }>({
      method: 'POST',
      path: '/v1/pos/carts/abandon',
      body: {
        email: params.email,
        items: params.items ?? [],
        ...(params.cartTotal !== undefined && { cart_total: params.cartTotal }),
      },
    });
    return { cartId: raw.cart_id ?? '' };
  }

  async listAbandonedCarts(opts: { minutes?: number; limit?: number } = {}): Promise<Array<{
    cartId: string; email: string; items: Array<Record<string, unknown>>; total: number; createdAt: string | null;
  }>> {
    const raw = await this.call<{ carts?: Array<Record<string, unknown>> }>({
      method: 'GET',
      path: '/v1/pos/carts/abandoned',
      query: { minutes: opts.minutes ?? 60, limit: opts.limit ?? 50 },
    });
    return (raw.carts ?? []).map((c) => ({
      cartId: (c['cart_id'] as string) ?? '',
      email: (c['email'] as string) ?? '',
      items: (c['items'] as Array<Record<string, unknown>>) ?? [],
      total: Number(c['total'] ?? 0),
      createdAt: (c['created_at'] as string | null) ?? null,
    }));
  }

  async markAbandonedCart(cartId: string, status: 'emailed' | 'recovered' | 'dismissed'): Promise<void> {
    await this.call({
      method: 'POST',
      path: `/v1/pos/carts/${cartId}/mark`,
      body: { status },
    });
  }

  // ── Returns / RMA ───────────────────────────────────────────────────────────

  async requestReturn(
    orderId: string,
    params: { reason: string; items?: Array<{ productId: string; quantity?: number; reason?: string }>; notes?: string; customerEmail?: string },
  ): Promise<OrderReturn> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/orders/${orderId}/returns`,
      body: {
        reason: params.reason,
        ...(params.notes !== undefined && { notes: params.notes }),
        ...(params.customerEmail !== undefined && { customer_email: params.customerEmail }),
        ...(params.items ? {
          items: params.items.map((i) => ({
            product_id: i.productId,
            quantity: i.quantity ?? 1,
            ...(i.reason !== undefined && { reason: i.reason }),
          })),
        } : {}),
      },
    });
    return this._mapReturn(raw);
  }

  async listReturns(orderId: string): Promise<OrderReturn[]> {
    const raw = await this.call<{ returns?: Array<Record<string, unknown>> }>({
      method: 'GET',
      path: `/v1/pos/orders/${orderId}/returns`,
    });
    return (raw.returns ?? []).map((r) => this._mapReturn(r));
  }

  private _mapReturn(raw: Record<string, unknown>): OrderReturn {
    const items = (raw['items'] as Array<Record<string, unknown>> | undefined) ?? [];
    return {
      returnId:  (raw['return_id'] as string) ?? (raw['id'] as string) ?? '',
      orderId:   (raw['order_id'] as string) ?? '',
      status:    (raw['status'] as string) ?? 'requested',
      items: items.map((i) => ({
        productId: (i['product_id'] as string) ?? '',
        quantity: Number(i['quantity'] ?? 1),
        reason: (i['reason'] as string | null) ?? null,
      })),
      reason:    (raw['reason'] as string | null) ?? null,
      notes:     (raw['notes'] as string | null) ?? null,
      createdAt: (raw['created_at'] as string | null) ?? null,
      updatedAt: (raw['updated_at'] as string | null) ?? null,
    };
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
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<OrderingListResponse<BlogPost>> {
    const res = await this.callList<Record<string, unknown>>(
      {
        method: 'GET',
        path: '/v1/pos/blog/posts',
        query: {
          status: opts.status,
          tag: opts.tag,
          category_id: opts.categoryId,
          limit: opts.limit ?? 20,
          offset: opts.offset ?? 0,
        },
      },
      'posts',
    );
    return { ...res, data: res.data.map(mapBlogPost) };
  }

  /** The shop's blog categories, newest grouping first by the merchant's own
   *  order rather than alphabetically. */
  async listBlogCategories(): Promise<BlogCategory[]> {
    const raw = await this.call<{ categories?: Record<string, unknown>[] }>(
      { method: 'GET', path: '/v1/pos/blog/categories' },
    );
    return (raw.categories ?? []).map(mapBlogCategory);
  }

  /**
   * What readers have said under a post, and whether they still can.
   *
   * Approved comments only — the server decides, not this. The thread
   * carries the shop's policy with it because an empty list cannot tell a
   * page whether to draw the form or say nothing at all.
   */
  async listBlogComments(
    slug: string,
    opts: { sort?: 'oldest' | 'newest' } = {},
  ): Promise<BlogCommentThread> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'GET',
      path: `/v1/pos/blog/posts/${encodeURIComponent(slug)}/comments`,
      query: { sort: opts.sort },
    });
    return {
      comments: ((raw['comments'] as Record<string, unknown>[]) ?? [])
        .map(mapBlogComment),
      total: Number(raw['total'] ?? 0),
      isOpen: Boolean(raw['is_open'] ?? raw['isOpen']),
      closedReason: (raw['closed_reason'] as string | null) ?? null,
      allowGuests: Boolean(raw['allow_guests'] ?? raw['allowGuests']),
      moderated: Boolean(raw['moderated']),
      sort: (raw['sort'] ?? 'oldest') as 'oldest' | 'newest',
      canReport: Boolean(raw['can_report'] ?? raw['canReport']),
    };
  }

  /**
   * A reader raises a comment the shop has not read.
   *
   * Always resolves, whatever happened — the endpoint answers 202 and
   * nothing else on purpose. A reply that varied would let anybody probe
   * which comments are near being pulled, and would tell somebody their
   * own report worked, which is an invitation to send more.
   */
  async reportBlogComment(commentId: string): Promise<void> {
    await this.call({
      method: 'POST',
      path: `/v1/pos/blog/comments/${encodeURIComponent(commentId)}/report`,
    }).catch(() => undefined);
  }

  /**
   * Leave one.
   *
   * Resolves whatever the shop's moderation decided — the outcome carries
   * the state and the sentence to show. A held comment is **not** an
   * error: somebody told "something went wrong" writes it again, and the
   * shop receives it twice.
   *
   * `website` is a honeypot. Render it hidden, leave it empty, and send it.
   */
  async createBlogComment(slug: string, params: {
    body: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
    website?: string;
  }): Promise<BlogCommentOutcome> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/blog/posts/${encodeURIComponent(slug)}/comments`,
      body: {
        body: params.body,
        ...(params.authorName !== undefined && { author_name: params.authorName }),
        ...(params.authorEmail !== undefined && { author_email: params.authorEmail }),
        ...(params.parentId !== undefined && { parent_id: params.parentId }),
        ...(params.website !== undefined && { website: params.website }),
      },
    });
    return {
      comment: mapBlogComment((raw['comment'] ?? {}) as Record<string, unknown>),
      status: (raw['status'] ?? 'pending') as BlogComment['status'],
      message: (raw['message'] as string) ?? '',
    };
  }

  /** The moderation queue. Merchant token only — these carry addresses. */
  async listBlogCommentsForModeration(opts: {
    status?: BlogComment['status'];
    postId?: string;
    search?: string;
    limit?: number;
  } = {}): Promise<{
    comments: BlogComment[];
    total: number;
    counts: Record<string, number>;
    /** Only the posts that actually have comments, [id, title]. */
    posts: Array<[string, string]>;
  }> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'GET',
      path: '/v1/pos/blog/comments',
      query: {
        status: opts.status, post_id: opts.postId,
        search: opts.search, limit: opts.limit,
      },
    });
    return {
      comments: ((raw['comments'] as Record<string, unknown>[]) ?? [])
        .map(mapBlogComment),
      total: Number(raw['total'] ?? 0),
      counts: (raw['counts'] as Record<string, number>) ?? {},
      posts: (raw['posts'] as Array<[string, string]>) ?? [],
    };
  }

  /**
   * Twenty at a time, which is the actual job.
   *
   * Reports what happened per id rather than failing the lot on one: a
   * selection containing a comment somebody deleted a second ago should
   * still move the other nineteen.
   */
  async bulkModerateBlogComments(
    ids: string[],
    action: 'approve' | 'reject' | 'spam' | 'unspam' | 'delete',
  ): Promise<{ moved: number; missing: string[]; action: string }> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: '/v1/pos/blog/comments/bulk',
      body: { ids, action },
    });
    return {
      moved: Number(raw['moved'] ?? 0),
      missing: (raw['missing'] as string[]) ?? [],
      action: (raw['action'] as string) ?? action,
    };
  }

  /** The shop saying "read this one". One per post; pinning a second
   *  unpins the first. Only a published comment can be pinned. */
  async pinBlogComment(commentId: string, pinned = true): Promise<BlogComment> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/blog/comments/${encodeURIComponent(commentId)}/pin`,
      query: { pinned },
    });
    return mapBlogComment((raw['comment'] ?? raw) as Record<string, unknown>);
  }

  /**
   * Always approve this person, never approve them, or neither.
   *
   * What a merchant wants after approving the same name four times.
   * `forget` removes them from both lists — there is no third list of
   * people who have been un-blocked.
   */
  async decideAboutCommenter(
    email: string,
    decision: 'trust' | 'block' | 'forget',
  ): Promise<{ email: string; decision: string; trusted: string[]; blocked: string[] }> {
    return this.call({
      method: 'POST',
      path: `/v1/pos/blog/commenters/${encodeURIComponent(email)}`,
      body: { decision },
    });
  }

  /** Approve it, take it down, call it spam, or send it back to the queue. */
  async moderateBlogComment(
    commentId: string,
    action: 'approve' | 'reject' | 'spam' | 'unspam',
  ): Promise<BlogComment> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'PATCH',
      path: `/v1/pos/blog/comments/${encodeURIComponent(commentId)}`,
      body: { action },
    });
    return mapBlogComment((raw['comment'] ?? raw) as Record<string, unknown>);
  }

  /** The shop answers. Published on sight, and approves what it answers. */
  async replyToBlogComment(commentId: string, body: string): Promise<BlogComment> {
    const raw = await this.call<Record<string, unknown>>({
      method: 'POST',
      path: `/v1/pos/blog/comments/${encodeURIComponent(commentId)}/reply`,
      body: { body },
    });
    return mapBlogComment((raw['comment'] ?? raw) as Record<string, unknown>);
  }

  /** Gone, with its replies. Distinct from `reject`, which keeps it. */
  async deleteBlogComment(commentId: string): Promise<void> {
    await this.call({
      method: 'DELETE',
      path: `/v1/pos/blog/comments/${encodeURIComponent(commentId)}`,
    });
  }

  async getBlogPost(slug: string): Promise<BlogPost | null> {
    try {
      const raw = await this.call<Record<string, unknown>>(
        { method: 'GET', path: `/v1/pos/blog/posts/${encodeURIComponent(slug)}` },
      );
      const post = (raw['post'] ?? raw) as Record<string, unknown>;
      return post && post['id'] ? mapBlogPost(post) : null;
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
    const res = await this.callList<Record<string, unknown>>(
      {
        method: 'GET',
        path: '/v1/pos/pages',
        query: { is_published: opts.isPublished },
      },
      'pages',
    );
    return { ...res, data: res.data.map(_mapCustomPage) };
  }

  /**
   * One page, under any address it has ever had.
   *
   * `redirectTo` comes back when the address asked for is an old one. The
   * shop should send a permanent redirect rather than serving the same
   * page at two URLs — otherwise a rename splits the page's search ranking
   * and the old address never retires.
   */
  async getCustomPage(
    slug: string,
  ): Promise<(CustomPage & { redirectTo?: string }) | null> {
    try {
      const raw = await this.call<Record<string, unknown>>(
        { method: 'GET', path: `/v1/pos/pages/${encodeURIComponent(slug)}` },
      );
      const body = (raw.page ?? raw) as Record<string, unknown>;
      const page = _mapCustomPage(body);
      const redirectTo = raw.redirect_to as string | undefined;
      return redirectTo ? { ...page, redirectTo } : page;
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
