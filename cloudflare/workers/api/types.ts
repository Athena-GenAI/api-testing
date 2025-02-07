/// <reference types="@cloudflare/workers-types" />

export interface Env {
  SMART_MONEY_CACHE: KVNamespace;
  SMART_MONEY_BUCKET: R2Bucket;
}

export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface TokenPosition {
  token: string;
  total_positions: number;
  percentage: string;
  position: 'LONG' | 'SHORT' | 'NEUTRAL';
}
