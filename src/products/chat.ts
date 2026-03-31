import { HttpClient } from '../http.js';
import { RateLimitInfo } from '../error.js';

// ─── Models ───────────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  inboxId: string;
  contactId: string;
  assignedAgentId?: string;
  status: 'open' | 'resolved' | 'pending' | 'snoozed';
  subject?: string;
  channel: 'web' | 'email' | 'sms' | 'whatsapp' | 'instagram' | 'twitter';
  unreadCount: number;
  firstReplyAt?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListConversationsParams {
  limit?: number;
  offset?: number;
  inboxId?: string;
  assignedAgentId?: string;
  status?: Conversation['status'];
  contactId?: string;
}

export interface CreateConversationParams {
  inboxId: string;
  contactId: string;
  assignedAgentId?: string;
  subject?: string;
  initialMessage?: string;
}

export interface UpdateConversationParams {
  status?: Conversation['status'];
  assignedAgentId?: string | null;
  subject?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  authorType: 'agent' | 'contact' | 'bot' | 'system';
  authorId: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'template';
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
  }>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListMessagesParams {
  limit?: number;
  before?: string;
}

export interface SendMessageParams {
  content: string;
  contentType?: Message['contentType'];
  attachments?: Array<{ url: string; name: string; type: string }>;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'supervisor' | 'admin';
  isAvailable: boolean;
  inboxIds: string[];
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentParams {
  name: string;
  email: string;
  role?: Agent['role'];
  inboxIds?: string[];
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  avatarUrl?: string;
  identifier?: string;
  customAttributes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ListContactsParams {
  limit?: number;
  offset?: number;
  search?: string;
  email?: string;
  phone?: string;
}

export interface CreateContactParams {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  identifier?: string;
  customAttributes?: Record<string, string>;
}

export interface Inbox {
  id: string;
  name: string;
  channel: Conversation['channel'];
  isEnabled: boolean;
  workingHoursEnabled: boolean;
  outOfOfficeMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class ChatClient {
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

  async listConversations(params?: ListConversationsParams): Promise<ListResponse<Conversation>> {
    return this.call({
      method: 'GET',
      path: '/v1/chat/conversations',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createConversation(params: CreateConversationParams): Promise<Conversation> {
    return this.call({ method: 'POST', path: '/v1/chat/conversations', body: params });
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.call({ method: 'GET', path: `/v1/chat/conversations/${id}` });
  }

  async updateConversation(id: string, params: UpdateConversationParams): Promise<Conversation> {
    return this.call({ method: 'PATCH', path: `/v1/chat/conversations/${id}`, body: params });
  }

  async listMessages(conversationId: string, params?: ListMessagesParams): Promise<ListResponse<Message>> {
    return this.call({
      method: 'GET',
      path: `/v1/chat/conversations/${conversationId}/messages`,
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async sendMessage(conversationId: string, params: SendMessageParams): Promise<Message> {
    return this.call({
      method: 'POST',
      path: `/v1/chat/conversations/${conversationId}/messages`,
      body: params,
    });
  }

  async listAgents(params?: { inboxId?: string; isAvailable?: boolean }): Promise<ListResponse<Agent>> {
    return this.call({
      method: 'GET',
      path: '/v1/chat/agents',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createAgent(params: CreateAgentParams): Promise<Agent> {
    return this.call({ method: 'POST', path: '/v1/chat/agents', body: params });
  }

  async listContacts(params?: ListContactsParams): Promise<ListResponse<Contact>> {
    return this.call({
      method: 'GET',
      path: '/v1/chat/contacts',
      query: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createContact(params: CreateContactParams): Promise<Contact> {
    return this.call({ method: 'POST', path: '/v1/chat/contacts', body: params });
  }

  async getContact(id: string): Promise<Contact> {
    return this.call({ method: 'GET', path: `/v1/chat/contacts/${id}` });
  }

  async listInboxes(): Promise<ListResponse<Inbox>> {
    return this.call({ method: 'GET', path: '/v1/chat/inboxes' });
  }
}
