# @xeboki/sdk

Official JavaScript and TypeScript SDK for the [Xeboki developer API](https://developers.xeboki.com). Works in Node.js, React Native, and any modern browser environment.

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

Manage orders, products, inventory, customers, and sales reports.

#### Orders

```typescript
// List orders with optional filters
const { data, total } = await xeboki.pos.listOrders({
  limit: 50,
  offset: 0,
  status: 'completed',      // 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'
  locationId: 'loc_abc',
  customerId: 'cust_xyz',
  startDate: '2026-01-01',
  endDate: '2026-03-31',
});

// Get a single order
const order = await xeboki.pos.getOrder('ord_abc123');

// Create an order
const newOrder = await xeboki.pos.createOrder({
  locationId: 'loc_abc',
  paymentMethod: 'cash',
  items: [
    { productId: 'prod_1', quantity: 2 },
    { productId: 'prod_2', quantity: 1, modifiers: [{ modifierId: 'mod_oat' }] },
  ],
  customerId: 'cust_xyz',    // optional
  discount: 5.00,            // optional — absolute amount
  notes: 'No ice please',    // optional
});
```

**`Order` type**

| Field           | Type                                                                 |
|-----------------|----------------------------------------------------------------------|
| `id`            | `string`                                                             |
| `orderNumber`   | `string`                                                             |
| `status`        | `'pending' \| 'processing' \| 'completed' \| 'cancelled' \| 'refunded'` |
| `items`         | `OrderItem[]`                                                        |
| `subtotal`      | `number`                                                             |
| `tax`           | `number`                                                             |
| `discount`      | `number`                                                             |
| `total`         | `number`                                                             |
| `locationId`    | `string`                                                             |
| `employeeId`    | `string`                                                             |
| `paymentMethod` | `string`                                                             |
| `customerId`    | `string \| undefined`                                                |
| `createdAt`     | `string` (ISO 8601)                                                  |

#### Products

```typescript
// List products
const { data: products } = await xeboki.pos.listProducts({
  locationId: 'loc_abc',
  categoryId: 'cat_drinks',
  isActive: true,
  search: 'espresso',
  limit: 100,
});

// Create a product
const product = await xeboki.pos.createProduct({
  name: 'Flat White',
  price: 4.50,
  locationId: 'loc_abc',
  taxRate: 0.10,
  trackInventory: true,
  categoryId: 'cat_coffee',
});

// Update a product
const updated = await xeboki.pos.updateProduct('prod_abc', {
  price: 4.75,
  isActive: false,
});
```

#### Inventory

```typescript
// List inventory (optionally filter to low-stock only)
const { data: items } = await xeboki.pos.listInventory({
  locationId: 'loc_abc',
  lowStockOnly: true,
});

// Adjust inventory level
const item = await xeboki.pos.updateInventory('inv_abc', {
  quantity: 50,
  reason: 'restock',
  notes: 'Weekly delivery',
});
```

#### Customers

```typescript
// Search customers
const { data: customers } = await xeboki.pos.listCustomers({
  search: 'jane',
  limit: 20,
});

// Create a customer
const customer = await xeboki.pos.createCustomer({
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1-555-0100',
});
```

#### Reporting

```typescript
// Sales report
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
