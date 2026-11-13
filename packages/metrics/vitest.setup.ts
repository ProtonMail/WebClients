import { vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetchMock = createFetchMock(vi);
fetchMock.enableMocks();
globalThis.fetchMock = fetchMock;
