import type { FetchMock } from 'vitest-fetch-mock';

declare global {
    var fetchMock: FetchMock;
}
