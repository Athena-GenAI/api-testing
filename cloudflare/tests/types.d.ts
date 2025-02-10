import { jest } from '@jest/globals';

// D1 Database Types
export interface D1Meta {
  duration: number;
  size_after: number;
  rows_read: number;
  rows_written: number;
  last_row_id: number;
  changed_db: boolean;
  changes: number;
}

export interface D1Result<T> {
  success: boolean;
  results: T[];
  meta: D1Meta;
}

export interface D1PreparedStatement {
  statement: string;
  values: unknown[];
}

// Workers AI Types
export interface AI {
  run(model: string, input: unknown): Promise<unknown>;
  models(): Promise<string[]>;
  prepare(model: string): {
    run(input: unknown): Promise<unknown>;
    stream(input: unknown): Promise<unknown>;
  };
}

// Basic Request Types
export interface CfProperties {
  [key: string]: any;
}

export interface SimpleHeaders {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  has(name: string): boolean;
  set(name: string, value: string): void;
  forEach(callback: (value: string, key: string) => void): void;
  entries(): IterableIterator<[string, string]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string>;
  getSetCookie(): string[];
  toHeadersInit(): HeadersInit;
}

export interface SimpleResponse {
  readonly headers: SimpleHeaders;
  readonly ok: boolean;
  readonly status: number;
  readonly statusText: string;
  readonly redirected: boolean;
  readonly type: ResponseType;
  readonly url: string;
  readonly body: ReadableStream | null;
  readonly bodyUsed: boolean;
  readonly webSocket: null;
  clone(): SimpleResponse;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<unknown>;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
}

export interface SimpleRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: SimpleHeaders;
  readonly cf?: CfProperties;
  readonly cache: RequestCache;
  readonly credentials: RequestCredentials;
  readonly destination: RequestDestination;
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly mode: RequestMode;
  readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly referrerPolicy: ReferrerPolicy;
  readonly signal: AbortSignal;
  readonly body: ReadableStream | null;
  readonly bodyUsed: boolean;
  readonly fetcher: null;
  clone(): SimpleRequest;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<unknown>;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
}

// Position Types
export interface Position {
  id: string;
  protocol: string;
  trader: string;
  tokenAddress: string;
  size: number;
  leverage: number;
  direction: 'LONG' | 'SHORT';
  openPrice: number;
  timestamp: number;
}

export interface Analysis {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  factors: string[];
}

export interface HistoricalAnalysis {
  trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidenceOverTime: {
    timestamp: number;
    confidence: number;
  }[];
}

declare global {
  var AI: jest.Mock;
  var fetch: jest.Mock;
  var Headers: jest.Mock;
  var Request: jest.Mock;
  var Response: jest.Mock;
  var D1Database: jest.Mock;
}

export {};
