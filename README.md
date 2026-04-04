<p align="center">
  <img src="assets/xe_logo.svg" alt="Xeboki" width="120" />
</p>

<h1 align="center">Xeboki SDK for JavaScript & TypeScript</h1>

<p align="center">Official JavaScript and TypeScript SDK for the <a href="https://developers.xeboki.com">Xeboki developer API</a>. Works in Node.js, React Native, and any modern browser environment.</p>

[![npm version](https://img.shields.io/npm/v/@xeboki/sdk)](https://www.npmjs.com/package/@xeboki/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Requirements

- Node.js 18 or later (uses the native `fetch` API)
- TypeScript 5.0+ (optional but recommended)

## Installation

```bash
npm install @xeboki/sdk
# or
yarn add @xeboki/sdk
# or
pnpm add @xeboki/sdk
```

## Quick Start

```typescript
import { XebokiClient } from '@xeboki/sdk';

const xeboki = new XebokiClient({ apiKey: 'xbk_live_...' });

// List the last 20 orders from your POS
const { data: orders } = await xeboki.pos.listOrders({ limit: 20 });
console.log(orders);

// Check remaining rate limit after any call
console.log(xeboki.lastRateLimit?.remaining);
```

## Authentication

All requests are authenticated with an API key. Generate and manage your keys at [account.xeboki.com/developer](https://account.xeboki.com/developer).

| Key prefix      | Environment |
|-----------------|-------------|
| `xbk_live_...`  | Production  |
| `xbk_test_...`  | Sandbox     |

**Never expose your API key on the client side.** Use it only in server-side or backend code.

## Client Options

```typescript
const xeboki = new XebokiClient({
  apiKey: 'xbk_live_...',   // required
  baseUrl: 'https://api.xeboki.com',  // optional — override for self-hosted
  timeout: 30_000,           // optional — ms, default 30 000
});
```

---

## Products

The client exposes one sub-client per Xeboki product. Every method returns a typed `Promise`.

### `xeboki.pos` — Point of Sale

Build custom ordering apps, mobile storefronts, kiosk interfaces, and integrations on top of any subscriber's POS data.

#### Catalog

Browse the store's live product catalog and categories.

```typescript
// List active products
const { data: products } = await xeboki.pos.listProducts({
  locationId: 'loc_abc',
  categoryId: 'cat_drinks',
  isActive: true,
  search: 'espresso',
  limit: 100,
});

// Get a single product
const product = await xeboki.pos.getProduct('prod_abc');
console.log(product.name, product.price, product.modifierGroups);

// List categories
const { data: categories } = await xeboki.pos.listCategories({
  locationId: 'loc_abc',
  isActive: true,
});
```

#### Orders

```typescript
// List orders
const { data, total } = await xeboki.pos.listOrders({
  limit: 50,
  offset: 0,
  status: 'pending',           // 'pending'|'confirmed'|'processing'|'ready'|'completed'|'cancelled'
  locationId: 'loc_abc',
  customerId: 'cust_xyz',
  startDate: '2026-01-01',
  endDate: '2026-03-31',
});

// Get a single order
const order = await xeboki.pos.getOrder('ord_abc123');

// Create an order — inventory is atomically reserved on create
const newOrder = await xeboki.pos.createOrder(
  {
    locationId: 'loc_abc',
    orderType: 'pickup',          // 'pickup' | 'delivery' | 'dine_in' | 'takeaway'
    items: [
      { productId: 'prod_1', quantity: 2 },
      { productId: 'prod_2', quantity: 1, modifiers: [{ modifierId: 'mod_oat' }] },
    ],
    customerId: 'cust_xyz',       // optional
    reference: 'web-order-991',   // optional — your external order ID (also acts as idempotency key)
    notes: 'No ice please',
    tableId: 'tbl_5',             // optional — for dine_in orders
  },
  { idempotencyKey: crypto.randomUUID() }  // optional — prevents duplicate orders on network retry
);

// Update order status (enforces valid transitions — invalid transitions return 409)
await xeboki.pos.updateOrderStatus('ord_abc123', {
  status: 'confirmed',   // pending→confirmed→processing→ready→completed
  note: 'Confirmed by kitchen',
});

// Cancel an order (inventory is automatically restored)
await xeboki.pos.updateOrderStatus('ord_abc123', { status: 'cancelled' });
```

**Order status machine**

```
pending → confirmed → processing → ready → completed
any non-terminal status → cancelled
```

**`Order` type**

| Field          | Type                                                                              |
|----------------|-----------------------------------------------------------------------------------|
| `id`           | `string`                                                                          |
| `orderNumber`  | `string`                                                                          |
| `status`       | `'pending'\|'confirmed'\|'processing'\|'ready'\|'completed'\|'cancelled'`         |
| `orderType`    | `'pickup'\|'delivery'\|'dine_in'\|'takeaway'`                                     |
| `items`        | `OrderItem[]`                                                                     |
| `subtotal`     | `number`                                                                          |
| `tax`          | `number`                                                                          |
| `discount`     | `number`                                                                          |
| `total`        | `number`                                                                          |
| `paidTotal`    | `number`                                                                          |
| `reference`    | `string \| undefined` — your external order ID                                    |
| `locationId`   | `string`                                                                          |
| `customerId`   | `string \| undefined`                                                             |
| `createdAt`    | `string` (ISO 8601)                                                               |

#### Payments

The POS API **records** payments — it does not process card charges. Your app collects payment via Stripe, Square, or any other gateway, then records the result here.

```typescript
// Record a single full payment
const payment = await xeboki.pos.payOrder('ord_abc123', {
  method: 'card',              // 'cash'|'card'|'gift_card'|'store_credit'|'online'|...
  amount: 42.50,
  reference: 'pi_stripe_abc',  // optional — your payment gateway transaction ID
});

// Split payment — add partial amounts one at a time
const first = await xeboki.pos.addPayment('ord_abc123', {
  method: 'cash',
  amount: 20.00,
});
console.log(first.remainingAmount);  // how much is still owed

const second = await xeboki.pos.addPayment('ord_abc123', {
  method: 'card',
  amount: 22.50,
  reference: 'pi_stripe_xyz',
});
console.log(second.isFullyPaid);   // true — order auto-moves to 'completed'

// List all payments recorded against an order
const { data: payments } = await xeboki.pos.listPayments('ord_abc123');
```

**`AddPaymentResponse` fields**

| Field             | Type      | Description                                       |
|-------------------|-----------|---------------------------------------------------|
| `payment`         | `Payment` | The payment just recorded                         |
| `paidTotal`       | `number`  | Running total paid so far                         |
| `remainingAmount` | `number`  | Amount still owed (`0` when fully paid)           |
| `changeDue`       | `number`  | Change to return to customer (cash overpay only)  |
| `isFullyPaid`     | `boolean` | `true` when the full order total has been paid    |
| `orderStatus`     | `string`  | Updated order status after this payment           |

#### Customers

```typescript
// Search / list customers
const { data: customers } = await xeboki.pos.listCustomers({
  search: 'jane',
  limit: 20,
});

// Get a single customer (includes loyalty points, store credit)
const customer = await xeboki.pos.getCustomer('cust_abc');

// Create a customer
const newCustomer = await xeboki.pos.createCustomer({
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1-555-0100',
});
```

#### Appointments

For service-based businesses — salons, gyms, repair shops, spas, etc.

```typescript
// List appointments
const { data: appts } = await xeboki.pos.listAppointments({
  locationId: 'loc_abc',
  status: 'confirmed',         // 'pending'|'confirmed'|'in_progress'|'completed'|'cancelled'|'no_show'
  date: '2026-04-15',
  staffId: 'staff_xyz',
});

// Get a single appointment
const appt = await xeboki.pos.getAppointment('appt_abc');

// Book an appointment
const newAppt = await xeboki.pos.createAppointment({
  locationId: 'loc_abc',
  customerId: 'cust_xyz',
  serviceId: 'prod_haircut',   // maps to a product in the catalog
  staffId: 'staff_xyz',
  startTime: '2026-04-15T14:00:00Z',
  durationMinutes: 60,
  notes: 'Trim only',
});

// Update appointment status
await xeboki.pos.updateAppointmentStatus('appt_abc', {
  status: 'confirmed',
});
// When status → 'completed', a POS order is auto-created so revenue appears in sales reports
```

**Appointment status machine**

```
pending → confirmed → in_progress → completed
pending | confirmed | in_progress → cancelled
confirmed → no_show
```

#### Staff

```typescript
// List active staff members
const { data: staff } = await xeboki.pos.listStaff({
  locationId: 'loc_abc',
  isActive: true,
});

// Get a staff member
const member = await xeboki.pos.getStaffMember('staff_abc');
```

#### Discounts

```typescript
// List active discount rules
const { data: discounts } = await xeboki.pos.listDiscounts({
  locationId: 'loc_abc',
  isActive: true,
});

// Validate a discount code before applying it to an order
const result = await xeboki.pos.validateDiscount({
  code: 'SUMMER20',
  orderTotal: 85.00,
  locationId: 'loc_abc',
});
if (result.valid) {
  console.log(`${result.type}: ${result.value}`);   // 'percent': 20 or 'fixed': 10
  console.log(`Saves: $${result.discountAmount}`);
} else {
  console.log(result.reason);  // 'expired' | 'not_found' | 'minimum_not_met' | ...
}
```

#### Tables

```typescript
// List tables (dine-in businesses)
const { data: tables } = await xeboki.pos.listTables({
  locationId: 'loc_abc',
  status: 'available',         // 'available'|'occupied'|'reserved'|'cleaning'
});

// Update table status
await xeboki.pos.updateTable('tbl_5', { status: 'occupied' });
```

#### Gift Cards

```typescript
// Look up a gift card by code
const card = await xeboki.pos.getGiftCard('GC-XYZ-123');
console.log(card.balance);    // current balance
console.log(card.isActive);   // false if expired or fully redeemed
console.log(card.expiresAt);  // ISO 8601, or null if no expiry
```

#### Inventory

```typescript
// List inventory (optionally filter to low-stock only)
const { data: items } = await xeboki.pos.listInventory({
  locationId: 'loc_abc',
  lowStockOnly: true,
});

// Adjust inventory level
await xeboki.pos.updateInventory('inv_abc', {
  quantity: 50,
  reason: 'restock',
  notes: 'Weekly delivery',
});
```

#### Webhooks

Register an HTTPS endpoint to receive real-time POS events pushed to your server.

```typescript
// Register a webhook
const webhook = await xeboki.pos.createWebhook({
  url: 'https://yourserver.com/xeboki/events',
  events: ['order.created', 'order.completed', 'order.cancelled'],
});
console.log(webhook.secret);  // whsec_... — shown ONCE, store it securely now

// List registered webhooks (secret is masked — only a hint is returned)
const { data: webhooks } = await xeboki.pos.listWebhooks();

// Delete a webhook
await xeboki.pos.deleteWebhook('wh_abc123');
```

**Available POS events**

| Event                   | Fires when…                                                        |
|-------------------------|--------------------------------------------------------------------|
| `order.created`         | New order created via API                                          |
| `order.updated`         | Order status changes                                               |
| `order.completed`       | Order reaches `completed` state                                    |
| `order.cancelled`       | Order cancelled — inventory is auto-restored                       |
| `order.payment_added`   | Partial payment recorded on an order                               |
| `order.paid`            | Order is fully paid                                                |
| `appointment.created`   | New appointment booked                                             |
| `appointment.updated`   | Appointment status changes                                         |
| `appointment.completed` | Appointment completed — a POS order is auto-created               |
| `appointment.cancelled` | Appointment cancelled                                              |
| `inventory.low_stock`   | Product stock falls below configured threshold                     |

**Verifying webhook signatures**

Every webhook POST includes a `X-Xeboki-Signature: sha256=<hex>` header. Always verify it:

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

function verifyWebhook(secret: string, rawBody: string, signature: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(rawBody).digest('hex');
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// Express.js example — use raw body parser
app.post('/xeboki/events', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['x-xeboki-signature'] as string;
  if (!verifyWebhook(process.env.WEBHOOK_SECRET!, req.body.toString(), sig)) {
    return res.status(401).send('Bad signature');
  }
  const { event, data } = JSON.parse(req.body.toString());
  // handle event...
  res.sendStatus(200);
});
```

#### Reporting

```typescript
// Sales summary
const report = await xeboki.pos.getSalesReport({
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  locationId: 'loc_abc',
});
console.log(report.totalRevenue, report.averageOrderValue);
console.log(report.topProducts);       // ranked by revenue
console.log(report.revenueByDay);      // day-by-day breakdown
console.log(report.paymentBreakdown);  // cash / card / etc.
```

#### POS Sessions

```typescript
const { data: sessions } = await xeboki.pos.listSessions({
  locationId: 'loc_abc',
  status: 'open',
});
```

---

### `xeboki.chat` — Customer Support

Manage conversations, messages, agents, contacts, and inboxes across all channels.

```typescript
// List open conversations
const { data: convos } = await xeboki.chat.listConversations({
  status: 'open',
  inboxId: 'inbox_web',
});

// Send a message
const msg = await xeboki.chat.sendMessage('conv_abc', {
  content: 'How can I help you today?',
  contentType: 'text',
});

// Resolve a conversation
const updated = await xeboki.chat.updateConversation('conv_abc', {
  status: 'resolved',
});

// Create a contact
const contact = await xeboki.chat.createContact({
  name: 'Alex Smith',
  email: 'alex@example.com',
  company: 'Acme Corp',
});

// List agents
const { data: agents } = await xeboki.chat.listAgents({ isAvailable: true });

// List inboxes
const { data: inboxes } = await xeboki.chat.listInboxes();
```

**Supported channels:** `web` · `email` · `sms` · `whatsapp` · `instagram` · `twitter`

---

### `xeboki.link` — URL Shortener

Create, manage, and analyse short links.

```typescript
// Create a short link
const link = await xeboki.link.createLink({
  destinationUrl: 'https://yoursite.com/campaign/summer',
  title: 'Summer Sale',
  customCode: 'summer26',   // optional — custom slug
  tags: ['marketing', 'q2'],
  expiresAt: '2026-09-01T00:00:00Z',
});
console.log(link.shortUrl);  // https://xbk.io/summer26

// List all links
const { data: links } = await xeboki.link.listLinks({
  isActive: true,
  tag: 'marketing',
});

// Update a link
await xeboki.link.updateLink('lnk_abc', { isActive: false });

// Delete a link
await xeboki.link.deleteLink('lnk_abc');

// Analytics for a link
const analytics = await xeboki.link.getAnalytics('lnk_abc', {
  startDate: '2026-03-01',
  endDate: '2026-03-31',
  granularity: 'day',  // 'day' | 'week' | 'month'
});
console.log(analytics.totalClicks, analytics.topCountries);
```

---

### `xeboki.removebg` — Background Removal

Remove or replace image backgrounds programmatically.

```typescript
// Remove background — submit a job
const job = await xeboki.removebg.removeBackground({
  imageUrl: 'https://example.com/photo.jpg',
  outputFormat: 'png',      // 'png' | 'jpg' | 'webp'
  backgroundColor: null,    // transparent
});

// Poll until complete
const result = await xeboki.removebg.getJob(job.jobId);
if (result.status === 'completed') {
  console.log(result.resultUrl);
}

// Batch process multiple images
const batch = await xeboki.removebg.createBatch({
  images: [
    { imageUrl: 'https://example.com/a.jpg' },
    { imageUrl: 'https://example.com/b.jpg' },
  ],
  outputFormat: 'png',
});
```

---

### `xeboki.analytics` — Cross-Product Analytics

Run reports across all Xeboki products.

```typescript
// List available reports
const { data: reports } = await xeboki.analytics.listReports({
  product: 'pos',
});

// Run a report
const data = await xeboki.analytics.getReport('rep_revenue_daily', {
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  groupBy: 'month',
  locationId: 'loc_abc',
});
console.log(data.summary);  // key metrics
console.log(data.series);   // time-series data

// Export to file (async — use webhookUrl to be notified on completion)
const exportJob = await xeboki.analytics.exportReport({
  reportId: 'rep_revenue_daily',
  format: 'csv',             // 'csv' | 'pdf' | 'xlsx'
  startDate: '2026-01-01',
  endDate: '2026-03-31',
  webhookUrl: 'https://yourserver.com/webhooks/export',
});
// Poll or wait for webhook:
const status = await xeboki.analytics.getExport(exportJob.exportId);
console.log(status.downloadUrl);
```

---

### `xeboki.account` — Account Management

Manage API keys, webhooks, team members, and subscription details.

```typescript
// Get account info
const account = await xeboki.account.getAccount();

// List API keys
const { data: keys } = await xeboki.account.listApiKeys();

// Create a new API key
const key = await xeboki.account.createApiKey({
  name: 'Mobile app production',
  scopes: ['pos:read', 'pos:write'],
});
console.log(key.key);  // shown only once

// Revoke a key
await xeboki.account.revokeApiKey('key_abc');

// Manage webhooks
const webhook = await xeboki.account.createWebhook({
  url: 'https://yourserver.com/webhooks',
  events: ['order.completed', 'conversation.created'],
  secret: 'wh_secret_...',
});

// List team members
const { data: members } = await xeboki.account.listMembers();

// Get current usage
const usage = await xeboki.account.getUsage();
console.log(usage.pos.used, usage.pos.limit);
```

---

### `xeboki.launchpad` — App Distribution

Manage your published apps, releases, and subscribers via the Xeboki Launchpad.

```typescript
// List your apps
const { data: apps } = await xeboki.launchpad.listApps();

// Get a specific app
const app = await xeboki.launchpad.getApp('app_abc');

// Create a release
const release = await xeboki.launchpad.createRelease('app_abc', {
  version: '2.4.0',
  releaseNotes: 'Bug fixes and performance improvements.',
  downloadUrl: 'https://cdn.example.com/myapp-2.4.0.apk',
  platform: 'android',
});

// List subscribers
const { data: subscribers } = await xeboki.launchpad.listSubscribers('app_abc', {
  plan: 'pro',
});
```

---

## Error Handling

All SDK methods throw `XebokiError` on non-2xx responses. Always wrap calls in `try/catch`.

```typescript
import { XebokiError } from '@xeboki/sdk';

try {
  const order = await xeboki.pos.createOrder({ ... });
} catch (err) {
  if (err instanceof XebokiError) {
    console.error(`Status: ${err.status}`);
    console.error(`Message: ${err.message}`);
    console.error(`Request ID: ${err.requestId}`);  // use this when contacting support

    if (err.status === 429) {
      console.log(`Retry after ${err.retryAfter} seconds`);
    }
  }
}
```

**`XebokiError` properties**

| Property      | Type               | Description                                              |
|---------------|--------------------|----------------------------------------------------------|
| `status`      | `number`           | HTTP status code (400, 401, 403, 404, 422, 429, 500...) |
| `message`     | `string`           | Human-readable error message                             |
| `requestId`   | `string?`          | Unique request ID — include in support tickets           |
| `retryAfter`  | `number?`          | Seconds to wait before retrying (only on 429)            |

**Common status codes**

| Status | Meaning                                                     |
|--------|-------------------------------------------------------------|
| `400`  | Bad request — check your parameters                         |
| `401`  | Invalid or missing API key                                  |
| `403`  | Insufficient permissions for the requested scope            |
| `404`  | Resource not found                                          |
| `422`  | Validation error — see `message` for field-level details    |
| `429`  | Rate limit exceeded — check `retryAfter`                    |
| `500`  | Server error — retry with exponential back-off              |

---

## Rate Limiting

Each Xeboki product has its own daily request quota tied to your subscription plan. The gateway returns live rate-limit headers on every response, which the SDK surfaces via `lastRateLimit`.

```typescript
const orders = await xeboki.pos.listOrders();

const rl = xeboki.lastRateLimit;
if (rl) {
  console.log(`${rl.remaining} / ${rl.limit} requests remaining`);
  console.log(`Resets at ${new Date(rl.reset * 1000).toISOString()}`);
}
```

**`RateLimitInfo` properties**

| Property    | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| `limit`     | `number` | Total daily requests allowed for this product    |
| `remaining` | `number` | Requests remaining today                         |
| `reset`     | `number` | Unix timestamp (UTC) when the counter resets     |
| `requestId` | `string` | ID of the most recent request                    |

> Limits are per-product and per-API-key. Check the [developer portal](https://developers.xeboki.com/reference) for the quota that applies to your plan.

---

## TypeScript

The SDK is written in TypeScript and ships with full type definitions. No `@types/*` package needed.

```typescript
import type { Order, Product, XebokiClientOptions } from '@xeboki/sdk';
```

All request parameter types follow the naming convention `Create<Resource>Params`, `Update<Resource>Params`, `List<Resource>Params`. All list endpoints return `ListResponse<T>` with `data`, `total`, `limit`, and `offset`.

---

## React Native

The SDK uses the standard `fetch` API with no Node.js-specific dependencies, so it works in React Native without any polyfills.

```typescript
// App.tsx
import { XebokiClient } from '@xeboki/sdk';

// Create once and store in context / Zustand / Redux
const xeboki = new XebokiClient({ apiKey: process.env.XEBOKI_API_KEY! });
```

---

## Support

- **Documentation:** [developers.xeboki.com](https://developers.xeboki.com)
- **Issues:** [github.com/xeboki/sdk-js/issues](https://github.com/xeboki/sdk-js/issues)
- **Email:** developers@xeboki.com

Include the `requestId` from `XebokiError` or `lastRateLimit` in all support requests — it lets us trace the exact request in our logs.

## License

MIT
