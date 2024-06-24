import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { type FetchController, fetchControllerFactory, getRequestID, getUID } from './fetch-controller';

class MockFetchEvent {
    public request: Request;

    public respondWith: (res: Response | PromiseLike<Response>) => void;

    constructor(_: string, init: { request: Request }) {
        this.request = init.request;
        this.respondWith = jest.fn(async (res: Response | PromiseLike<Response>) => {
            try {
                await res;
            } catch {}
        });
    }
}

const FetchEvent = MockFetchEvent as unknown as typeof globalThis.FetchEvent;
const asyncNextTick = () => new Promise(process.nextTick);

describe('fetch controller', () => {
    describe('getUID', () => {
        test('should return correct header value if present', () => {
            const uid = uniqueId();
            const request = new Request('https://pass.test/', { headers: { 'X-Pm-Uid': uid } });
            const event = new FetchEvent('fetch', { request });
            expect(getUID(event)).toEqual(uid);
        });

        test('should return null if header is not present', () => {
            const request = new Request('https://pass.test/', {});
            const event = new FetchEvent('fetch', { request });
            expect(getUID(event)).toBeNull();
        });
    });

    describe('getRequestID', () => {
        test('should return correct header value if present', () => {
            const requestId = uniqueId();
            const request = new Request('https://pass.test/', { headers: { 'X-Pass-Worker-RequestID': requestId } });
            const event = new FetchEvent('fetch', { request });
            expect(getRequestID(event)).toEqual(requestId);
        });

        test('should return null if header is not present', () => {
            const request = new Request('https://pass.test/', {});
            const event = new FetchEvent('fetch', { request });
            expect(getRequestID(event)).toBeNull();
        });
    });

    describe('FetchController', () => {
        let fetchController: FetchController;
        beforeEach(() => (fetchController = fetchControllerFactory()));

        describe('register', () => {
            test('should setup abort controller and respond with handler response', async () => {
                const requestId = uniqueId();
                const headers = { 'X-Pm-Uid': uniqueId(), 'X-Pass-Worker-RequestID': requestId };
                const request = new Request('https://pass.test/', { headers });
                const response = new Response(uniqueId(), { status: 200 });
                const event = new FetchEvent('fetch', { request });
                const cloneSpy = jest.spyOn(response, 'clone');

                const handler = jest.fn().mockResolvedValue(response);
                fetchController.register(handler)(event);

                expect(fetchController._controllers.get(requestId)).toBeInstanceOf(AbortController);

                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(cloneSpy).toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();

                const eventResponse = await (event.respondWith as jest.Mock).mock?.lastCall[0];
                await expect(eventResponse).toMatchResponse(eventResponse);
                expect(fetchController._controllers.get(requestId)).toBeUndefined();
            });

            test('should fallback to requestUrl as identifier if no `X-Pass-Worker-RequestID` header', async () => {
                const headers = { 'X-Pm-Uid': uniqueId() };
                const request = new Request('https://pass.test/', { headers });
                const response = new Response(uniqueId(), { status: 200 });
                const event = new FetchEvent('fetch', { request });
                const cloneSpy = jest.spyOn(response, 'clone');

                const handler = jest.fn().mockResolvedValue(response);

                fetchController.register(handler)(event);
                expect(fetchController._controllers.get('https://pass.test/')).toBeInstanceOf(AbortController);

                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(cloneSpy).toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();

                const eventResponse = await (event.respondWith as jest.Mock<any>).mock?.lastCall[0];
                await expect(eventResponse).toMatchResponse(response);
                expect(fetchController._controllers.get('https://pass.test/')).toBeUndefined();
            });

            test('should allow unauthenticated handlers', async () => {
                const request = new Request('https://pass.test/', {});
                const response = new Response(uniqueId(), { status: 200 });
                const event = new FetchEvent('fetch', { request });
                const cloneSpy = jest.spyOn(response, 'clone');

                const handler = jest.fn().mockResolvedValue(response);

                fetchController.register(handler, { unauthenticated: true })(event);
                expect(fetchController._controllers.get('https://pass.test/')).toBeInstanceOf(AbortController);

                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(cloneSpy).toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();

                const eventResponse = await (event.respondWith as jest.Mock<any>).mock?.lastCall[0];
                await expect(eventResponse).toMatchResponse(response);
                expect(fetchController._controllers.get('https://pass.test/')).toBeUndefined();
            });

            test('should noop if handler does not return a response', () => {
                const handler = jest.fn();

                const requestId = uniqueId();
                const headers = { 'X-Pm-Uid': uniqueId(), 'X-Pass-Worker-RequestID': requestId };
                const request = new Request('https://pass.test/', { headers });
                const response = new Response(uniqueId(), { status: 200 });
                const event = new FetchEvent('fetch', { request });
                const cloneSpy = jest.spyOn(response, 'clone');

                fetchController.register(handler)(event);

                expect(handler).toHaveBeenCalled();
                expect(cloneSpy).not.toHaveBeenCalled();
                expect(event.respondWith).not.toHaveBeenCalled();
                expect(fetchController._controllers.get(requestId)).toBeUndefined();
            });

            test('should noop if no UID header', () => {
                const handler = jest.fn();

                const request = new Request('https://pass.test/', {});
                const response = new Response(uniqueId(), { status: 403 });
                const event = new FetchEvent('fetch', { request });
                const cloneSpy = jest.spyOn(response, 'clone');

                fetchController.register(handler)(event);

                expect(handler).not.toHaveBeenCalled();
                expect(cloneSpy).not.toHaveBeenCalled();
                expect(event.respondWith).not.toHaveBeenCalled();
                expect(fetchController._controllers.get('https://pass.test/')).toBeUndefined();
            });

            test('should clear abort controller if handler throws', async () => {
                const handler = jest.fn().mockRejectedValue('TestError');

                const headers = { 'X-Pm-Uid': uniqueId() };
                const request = new Request('https://pass.test/', { headers });
                const response = new Response(uniqueId(), { status: 522 });
                const event = new FetchEvent('fetch', { request });
                const cloneSpy = jest.spyOn(response, 'clone');

                fetchController.register(handler)(event);

                expect(fetchController._controllers.get('https://pass.test/')).toBeInstanceOf(AbortController);
                await asyncNextTick();

                expect(handler).toHaveBeenCalled();
                expect(cloneSpy).not.toHaveBeenCalled();
                expect(event.respondWith).toHaveBeenCalled();
                expect(fetchController._controllers.get('https://pass.test/')).toBeUndefined();
            });
        });

        describe('fetch', () => {
            beforeEach(() => {
                global.fetch = jest.fn().mockResolvedValue(new Response());
            });

            test('should forward abort signal', async () => {
                const request = new Request('https://pass.test/', { headers: {} });
                const abort = new AbortController();
                await fetchController.fetch(request as Request, abort.signal);
                const params = (global.fetch as jest.Mock<any>).mock.lastCall;

                expect(global.fetch).toHaveBeenCalledTimes(1);
                expect(params[1].signal).toEqual(abort.signal);
            });

            test('should fetch with modified request without `X-Pass-Worker-RequestID` header', async () => {
                const headers = { 'X-Pass-Worker-RequestID': uniqueId() };
                const request = new Request('https://pass.test/', { headers });
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
