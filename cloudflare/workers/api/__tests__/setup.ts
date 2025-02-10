/// <reference types="@jest/globals" />
/// <reference types="@cloudflare/workers-types" />

import { jest } from '@jest/globals';

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
(global as any).fetch = fetchMock;

export { fetchMock };
