import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { type FetchController, fetchControllerFactory, getRequestID, getUID } from './fetch-controller';

class MockRequest {
    public url: string;

    public headers: Headers;

    constructor(options: { url: string; headers: HeadersInit }) {
        this.headers = new Headers(options.headers);
        this.url = options.url;
    }
}
class MockResponse {
    public testId: string;

    public clone: () => MockResponse;

    constructor() {
        this.testId = uniqueId();
        this.clone = jest.fn(() => this);
    }
}

class MockFetchEvent {
    public request: MockRequest;

    public respondWith: (res: Response | PromiseLike<Response>) => void;

    constructor(url: string, headers: HeadersInit) {
        this.request = new MockRequest({ url, headers });
        this.respondWith = jest.fn(async (res: Response | PromiseLike<Response>) => {
            try {
                await res;
            } catch {}
        });
    }
}

const asyncNextTick = () => new Promise(process.nextTick);

describe('fetch controller', () => {
    beforeAll(() => {
        Object.defineProperty(global, 'Request', { value: MockRequest });
        Object.defineProperty(global, 'Response', { value: MockResponse });
    });

    describe('getUID', () => {
        test('should return correct header value if present', () => {
            const uid = uniqueId();
            const event = new MockFetchEvent('/', { 'X-Pm-Uid': uid }) as FetchEvent;
            expect(getUID(event)).toEqual(uid);
        });

        test('should return null if header is not present', () => {
            const event = new MockFetchEvent('/', {}) as FetchEvent;
            expect(getUID(event)).toBeNull();
        });
    });

    describe('getRequestID', () => {
        test('should return correct header value if present', () => {
            const requestId = uniqueId();
            const event = new MockFetchEvent('/', { 'X-Pass-Worker-RequestID': requestId }) as FetchEvent;
            expect(getRequestID(event)).toEqual(requestId);
        });

        test('should return null if header is not present', () => {
            const event = new MockFetchEvent('/', {}) as FetchEvent;
            expect(getRequestID(event)).toBeNull();
        });
    });

    describe('FetchController', () => {
        let fetchController: FetchController;
        beforeEach(() => {
            fetchController = fetchControllerFactory();
        });

        describe('register', () => {
            test('should setup abort controller and respond with handler response', async () => {
                const requestId = uniqueId();
                const response = new MockResponse();
                const event = new MockFetchEvent('/', {
                    'X-Pm-Uid': uniqueId(),
                    'X-Pass-Worker-RequestID': requestId,
                }) as FetchEvent;

                const handler = jest.fn().mockResolvedValue(response);
                fetchController.register(handler)(event);
                expect(fetchController._controllers.get(requestId)).toBeInstanceOf(AbortController);

                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(response.clone).toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();
                await expect((event.respondWith as jest.Mock<any>).mock?.lastCall[0]).resolves.toEqual(response);
                expect(fetchController._controllers.get(requestId)).toBeUndefined();
            });

            test('should fallback to requestUrl as identifier if no `X-Pass-Worker-RequestID` header', async () => {
                const response = new MockResponse();
                const event = new MockFetchEvent('/', { 'X-Pm-Uid': uniqueId() }) as FetchEvent;
                const handler = jest.fn().mockResolvedValue(response);

                fetchController.register(handler)(event);
                expect(fetchController._controllers.get('/')).toBeInstanceOf(AbortController);

                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(response.clone).toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();
                await expect((event.respondWith as jest.Mock<any>).mock?.lastCall[0]).resolves.toEqual(response);
                expect(fetchController._controllers.get('/')).toBeUndefined();
            });

            test('should allow unauthenticated handlers', async () => {
                const response = new MockResponse();
                const event = new MockFetchEvent('/', {}) as FetchEvent;
                const handler = jest.fn().mockResolvedValue(response);

                fetchController.register(handler, { unauthenticated: true })(event);
                expect(fetchController._controllers.get('/')).toBeInstanceOf(AbortController);

                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(response.clone).toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();
                await expect((event.respondWith as jest.Mock<any>).mock?.lastCall[0]).resolves.toEqual(response);
                expect(fetchController._controllers.get('/')).toBeUndefined();
            });

            test('should noop if handler does not return a response', () => {
                const handler = jest.fn();
                const response = new MockResponse();
                const requestId = uniqueId();
                const event = new MockFetchEvent('/', {
                    'X-Pm-Uid': uniqueId(),
                    'X-Pass-Worker-RequestID': requestId,
                }) as FetchEvent;

                fetchController.register(handler)(event);

                expect(handler).toHaveBeenCalled();
                expect(response.clone).not.toHaveBeenCalled();
                expect(event.respondWith).not.toHaveBeenCalled();
                expect(fetchController._controllers.get(requestId)).toBeUndefined();
            });

            test('should noop if no UID header', () => {
                const handler = jest.fn();
                const response = new MockResponse();
                const event = new MockFetchEvent('/', {}) as FetchEvent;
                fetchController.register(handler)(event);

                expect(handler).not.toHaveBeenCalled();
                expect(response.clone).not.toHaveBeenCalled();
                expect(event.respondWith).not.toHaveBeenCalled();
                expect(fetchController._controllers.get('/')).toBeUndefined();
            });

            test('should clear abort controller if handler throws', async () => {
                const handler = jest.fn().mockRejectedValue('TestError');
                const response = new MockResponse();
                const event = new MockFetchEvent('/', { 'X-Pm-Uid': uniqueId() }) as FetchEvent;
                fetchController.register(handler)(event);

                expect(fetchController._controllers.get('/')).toBeInstanceOf(AbortController);
                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(response.clone).not.toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();
                expect(fetchController._controllers.get('/')).toBeUndefined();
            });
        });

        describe('fetch', () => {
            beforeEach(() => {
                global.fetch = jest.fn().mockResolvedValue(new MockResponse());
            });

            test('should forward abort signal', async () => {
                const request = new MockRequest({ url: '/', headers: {} });
                const abort = new AbortController();
                await fetchController.fetch(request as Request, abort.signal);
                const params = (global.fetch as jest.Mock<any>).mock.lastCall;

                expect(global.fetch).toHaveBeenCalledTimes(1);
                expect(params[1].signal).toEqual(abort.signal);
            });

            test('should fetch with modified request without `X-Pass-Worker-RequestID` header', async () => {
                const request = new MockRequest({ url: '/', headers: { 'X-Pass-Worker-RequestID': uniqueId() } });
                const abort = new AbortController();
                await fetchController.fetch(request as Request, abort.signal);
                const params = (global.fetch as jest.Mock<any>).mock.lastCall;

                expect(global.fetch).toHaveBeenCalledTimes(1);
                expect(params[0].headers.get('X-Pass-Worker-RequestID')).toBeNull();
                expect(params[1].signal).toEqual(abort.signal);
            });
        });

        describe('abort', () => {
            test('should abort controller for requestId', () => {
                const abortCtrl = new AbortController();
                jest.spyOn(abortCtrl, 'abort');
                fetchController._controllers.set('test', abortCtrl);
                fetchController.abort('test');

                expect(abortCtrl.abort).toHaveBeenCalled();
            });
        });
    });
});
