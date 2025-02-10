/**
 * Jest Test Setup
 * This file contains mock implementations for Cloudflare Workers runtime objects
 */

import { jest } from '@jest/globals';
import type {
  SimpleHeaders,
  SimpleRequest,
  SimpleResponse,
  D1Meta,
  D1Result,
  D1PreparedStatement,
  CfProperties
} from './types';

// Mock Headers implementation
class MockHeaders implements SimpleHeaders {
  private headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this.headers = new Map();
    if (init) {
      if (init instanceof Headers || init instanceof MockHeaders) {
        init.forEach((value, key) => this.set(key, value));
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  append(name: string, value: string): void {
    const existing = this.get(name);
    if (existing) {
      this.set(name, `${existing}, ${value}`);
    } else {
      this.set(name, value);
    }
  }

  delete(name: string): void {
    this.headers.delete(name.toLowerCase());
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }

  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }

  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach((value, key) => callback(value, key));
  }

  entries(): IterableIterator<[string, string]> {
    return this.headers.entries();
  }

  keys(): IterableIterator<string> {
    return this.headers.keys();
  }

  values(): IterableIterator<string> {
    return this.headers.values();
  }

  getSetCookie(): string[] {
    const cookies = this.get('set-cookie');
    return cookies ? cookies.split(', ') : [];
  }

  toHeadersInit(): HeadersInit {
    const init: Record<string, string> = {};
    this.forEach((value, key) => {
      init[key] = value;
    });
    return init;
  }
}

// Mock Response implementation
class MockResponse implements SimpleResponse {
  readonly headers: SimpleHeaders;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly type: ResponseType;
  readonly url: string;
  readonly body: ReadableStream | null;
  readonly bodyUsed: boolean;
  readonly webSocket: null;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.headers = new MockHeaders(init?.headers);
    this.status = init?.status || 200;
    this.statusText = init?.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.redirected = false;
    this.type = 'default';
    this.url = '';
    this.body = null;
    this.bodyUsed = false;
    this.webSocket = null;
  }

  clone(): SimpleResponse {
    const clonedHeaders = new MockHeaders();
    this.headers.forEach((value, key) => clonedHeaders.set(key, value));
    
    return new MockResponse(null, {
      status: this.status,
      statusText: this.statusText,
      headers: clonedHeaders.toHeadersInit()
    });
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  blob(): Promise<Blob> {
    return Promise.resolve(new Blob());
  }

  formData(): Promise<FormData> {
    return Promise.resolve(new FormData());
  }

  json(): Promise<any> {
    return Promise.resolve({});
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array());
  }
}

// Mock Request implementation
class MockRequest implements SimpleRequest {
  readonly cache: RequestCache;
  readonly credentials: RequestCredentials;
  readonly destination: RequestDestination;
  readonly headers: SimpleHeaders;
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly method: string;
  readonly mode: RequestMode;
  readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly referrerPolicy: ReferrerPolicy;
  readonly signal: AbortSignal;
  readonly url: string;
  readonly body: ReadableStream | null;
  readonly bodyUsed: boolean;
  readonly fetcher: null;
  readonly cf?: CfProperties;

  constructor(input: RequestInfo | URL, init?: RequestInit & { cf?: CfProperties }) {
    this.method = init?.method || 'GET';
    this.url = typeof input === 'string' ? input : input.toString();
    this.headers = new MockHeaders(init?.headers);
    this.body = null;
    this.bodyUsed = false;
    this.cache = init?.cache || 'default';
    this.credentials = init?.credentials || 'same-origin';
    this.destination = '' as RequestDestination;
    this.integrity = '';
    this.keepalive = false;
    this.mode = init?.mode || 'cors';
    this.redirect = init?.redirect || 'follow';
    this.referrer = 'about:client';
    this.referrerPolicy = init?.referrerPolicy || '';
    this.signal = init?.signal || new AbortController().signal;
    this.fetcher = null;
    this.cf = init?.cf;
  }

  clone(): SimpleRequest {
    const clonedHeaders = new MockHeaders();
    this.headers.forEach((value, key) => clonedHeaders.set(key, value));
    
    return new MockRequest(this.url, {
      method: this.method,
      headers: clonedHeaders.toHeadersInit(),
      cache: this.cache,
      credentials: this.credentials,
      mode: this.mode,
      redirect: this.redirect,
      referrerPolicy: this.referrerPolicy,
      signal: this.signal,
      cf: this.cf
    });
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }

  blob(): Promise<Blob> {
    return Promise.resolve(new Blob());
  }

  formData(): Promise<FormData> {
    return Promise.resolve(new FormData());
  }

  json(): Promise<any> {
    return Promise.resolve({});
  }

  text(): Promise<string> {
    return Promise.resolve('');
  }

  bytes(): Promise<Uint8Array> {
    return Promise.resolve(new Uint8Array());
  }
}

// Mock fetch
const mockFetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => Promise.resolve(new MockResponse()));
(global as any).fetch = mockFetch;

// Create Response constructor mock with static methods
const ResponseConstructor = Object.assign(
  jest.fn((body?: BodyInit | null, init?: ResponseInit) => new MockResponse(body, init)),
  {
    error: () => new MockResponse(null, { status: 500, statusText: 'Internal Server Error' }),
    redirect: (url: string | URL, status = 302) => new MockResponse(null, {
      status,
      headers: { Location: url.toString() }
    }),
    json: (data: unknown, init?: ResponseInit) => new MockResponse(JSON.stringify(data), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
    })
  }
);

(global as any).Response = ResponseConstructor;

// Mock Request
const RequestConstructor = jest.fn((input: RequestInfo | URL, init?: RequestInit & { cf?: CfProperties }) =>
  new MockRequest(input, init)
);

(global as any).Request = RequestConstructor;

// Mock Headers
const HeadersConstructor = jest.fn((init?: HeadersInit) => new MockHeaders(init));

(global as any).Headers = HeadersConstructor;

// Mock D1Database
const mockD1Meta: D1Meta = {
  duration: 0,
  size_after: 0,
  rows_read: 0,
  rows_written: 0,
  last_row_id: 0,
  changed_db: false,
  changes: 0
};

const D1DatabaseConstructor = jest.fn(() => ({
  prepare: (query: string) => ({
    bind: (...values: unknown[]) => ({
      first: <T>(colName?: string) => Promise.resolve<T | null>(null),
      run: <T>() => Promise.resolve<D1Result<T>>({
        success: true,
        results: [],
        meta: mockD1Meta
      }),
      all: <T>() => Promise.resolve<D1Result<T>>({
        success: true,
        results: [],
        meta: mockD1Meta
      })
    })
  }),
  batch: <T>(statements: D1PreparedStatement[]) => 
    Promise.resolve<D1Result<T>[]>([{
      success: true,
      results: [],
      meta: mockD1Meta
    }]),
  exec: <T>(query: string) => 
    Promise.resolve<D1Result<T>>({
      success: true,
      results: [],
      meta: mockD1Meta
    }),
  dump: () => Promise.resolve(new ArrayBuffer(0))
}));

(global as any).D1Database = D1DatabaseConstructor;

// Mock Workers AI
const AIMock = jest.fn(() => ({
  run: (model: string, input: unknown) => Promise.resolve({}),
  models: () => Promise.resolve([]),
  prepare: (model: string) => ({
    run: (input: unknown) => Promise.resolve({}),
    stream: (input: unknown) => Promise.resolve({})
  })
}));

(global as any).AI = AIMock;
