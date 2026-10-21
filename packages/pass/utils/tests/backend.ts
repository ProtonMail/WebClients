import type { HttpResponseResolver, RequestHandler } from 'msw';
import { HttpResponse, delay, http } from 'msw';
import { setupServer } from 'msw/node';

import type { MaybeNull, MaybePromise } from '../../types/utils';
import type { TestPersistedSession } from './fixtures/session';

export const TEST_API_URL = 'https://pass.test/api';

type JsonBody = Record<string, unknown>;
type HttpMethod = 'get' | 'post' | 'put' | 'delete';

/** The API factory rejects any response without a `date` header */
const withDate = (headers: Record<string, string> = {}) => ({ date: new Date().toUTCString(), ...headers });

export const respond = {
    ok: (body: JsonBody = {}) => HttpResponse.json({ Code: 1000, ...body }, { headers: withDate() }),
    error: (status: number, body: JsonBody = {}, headers?: Record<string, string>) =>
        HttpResponse.json({ Code: 2000, Error: 'Test backend error', ...body }, { status, headers: withDate(headers) }),
    raw: (status: number, body: string, contentType: string) =>
        new HttpResponse(body, { status, headers: withDate({ 'content-type': contentType }) }),
};

/** `status` is `null` when no response reaches the client */
export type BackendFailure = { label: string; status: MaybeNull<number>; respond: () => MaybePromise<Response> };

/** Errors that must not log a user out on regular routes. `/auth/refresh` is
 * stricter: by the API contract, its 400 and 422 do invalidate the session. */
export const BACKEND_FAILURES: BackendFailure[] = [
    ...[400, 403, 404, 408, 409, 418, 422, 500, 502, 503, 504].map((status) => ({
        label: `${status}`,
        status,
        respond: () => respond.error(status),
    })),
    {
        label: '422 without code',
        status: 422,
        respond: () => HttpResponse.json({}, { status: 422, headers: withDate() }),
    },
    { label: '429 without retry-after', status: 429, respond: () => respond.error(429) },
    { label: '429 retry-after 2s', status: 429, respond: () => respond.error(429, {}, { 'retry-after': '2' }) },
    { label: '429 retry-after 30s', status: 429, respond: () => respond.error(429, {}, { 'retry-after': '30' }) },
    {
        label: '502 HTML page',
        status: 502,
        respond: () => respond.raw(502, '<html><body>Bad gateway</body></html>', 'text/html'),
    },
    { label: '503 empty body', status: 503, respond: () => respond.raw(503, '', 'text/plain') },
    {
        label: '200 non-JSON body',
        status: 200,
        respond: () => respond.raw(200, '<html><body>Maintenance</body></html>', 'text/html'),
    },
    { label: 'network error', status: null, respond: () => HttpResponse.error() },
    {
        label: 'timeout',
        status: null,
        respond: async () => {
            await delay('infinite');
            return respond.ok();
        },
    },
];

export const getSessionResumeHandlers = ({ clientKey, session }: TestPersistedSession): RequestHandler[] => [
    http.get(`${TEST_API_URL}/auth/v4/sessions/local/key`, () => respond.ok({ ClientKey: clientKey })),
    http.get(`${TEST_API_URL}/core/v4/users`, () => respond.ok({ User: { ID: session.UserID, Keys: [] } })),
];

/** MSW server answering every API route with a success by default. Handlers
 * registered through `use`/`on` win over earlier ones and reset after each test.
 * Node's `fetch` rejects jsdom's `AbortSignal`: specs need the
 * `@jest-environment-options {"abortSignal": true}` docblock. */
export const createTestBackend = () => {
    const requests: string[] = [];
    const server = setupServer(http.all(`${TEST_API_URL}/*`, () => respond.ok()));

    server.events.on('request:start', ({ request }) => {
        requests.push(request.url.replace(`${TEST_API_URL}/`, ''));
    });

    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

    afterEach(() => {
        server.resetHandlers();
        requests.length = 0;
    });

    afterAll(() => server.close());

    return {
        requests,
        countRequests: (path: string) => requests.filter((request) => request === path).length,
        use: (...handlers: RequestHandler[]) => server.use(...handlers),
        on: (method: HttpMethod, path: string, resolver: HttpResponseResolver) =>
            server.use(http[method](`${TEST_API_URL}/${path}`, resolver)),
    };
};
