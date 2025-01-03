import { withRequest } from '@proton/pass/store/request/enhancers';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import * as time from '@proton/pass/utils/time/epoch';
import noop from '@proton/utils/noop';

import { type RequestTracker, requestMiddlewareFactory, requestTrackerFactory } from './middleware';

describe('requestMiddleware', () => {
    let next: jest.Mock;
    let getState: jest.Mock;
    let tracker: RequestTracker;
    let apply: (action: unknown) => unknown;
    let acceptAsync: jest.Mock;

    const getEpoch = jest.spyOn(time, 'getEpoch').mockImplementation(() => 1);

    const requestID = `test-request-${uniqueId()}`;
    const payload = { value: Math.random() };
    const error = new Error('Test');
    const action = { type: 'test-action', payload };
    const actionFailure = { type: 'test-action-failure', error };
    const cachedState = { request: { [requestID]: { status: 'success', maxAge: 10, requestedAt: 0, data: payload } } };

    beforeEach(() => {
        jest.clearAllMocks();
        next = jest.fn();
        getState = jest.fn(() => ({ request: {} }));
        tracker = requestTrackerFactory();
        acceptAsync = jest.fn(() => true);
        apply = requestMiddlewareFactory({ tracker, acceptAsync })({ getState } as any)(next);
    });

    describe('non-request actions', () => {
        test('should forward non-request actions', () => {
            apply(action);
            expect(tracker.requests.size).toBe(0);
            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('request `start`', () => {
        describe('when no pending request', () => {
            test('should return noop for non-async request', () => {
                const res = apply(withRequest({ status: 'start', id: requestID })(action));
                expect(res).not.toBeInstanceOf(Promise);
                expect(next).toHaveBeenCalled();
            });

            test('should return noop if `acceptAsync` does not check', () => {
                acceptAsync.mockReturnValueOnce(false);
                const res = apply(withRequest({ status: 'start', id: requestID, async: true })(action));
                expect(res).not.toBeInstanceOf(Promise);
                expect(next).toHaveBeenCalled();
            });

            test('should return promise for async request', () => {
                const res = apply(withRequest({ status: 'start', id: requestID, async: true })(action));
                expect(res).toBeInstanceOf(Promise);
                expect(next).toHaveBeenCalledTimes(1);
            });

            test('should handle multiple different requests independently', async () => {
                const requestID2 = `test-request-${uniqueId()}`;
                const res1 = apply(withRequest({ status: 'start', id: requestID, async: true })(action));
                const res2 = apply(withRequest({ status: 'start', id: requestID2, async: true })(action));
                expect(tracker.requests.size).toBe(2);
                expect(res1).not.toBe(res2);
                expect(next).toHaveBeenCalledTimes(2);
            });
        });

        describe('when pending request', () => {
            test('should return pending promise for concurrent async requests', () => {
                /* simulate request in-flight */
                const res1 = tracker.push(requestID);
                getState.mockReturnValue({ request: { [requestID]: { status: 'start' } } });
                const res2 = apply(withRequest({ status: 'start', id: requestID, async: true })(action));

                expect(res2).toBeInstanceOf(Promise);
                expect(res2).toEqual(res1);
                expect(next).not.toHaveBeenCalled();
                expect(res2).toEqual(tracker.requests.get(requestID));
                expect(tracker.requests.size).toBe(1);
            });
        });

        describe('when cached request', () => {
            test('should return cached result', async () => {
                getState.mockReturnValue(cachedState);
                const res = await apply(withRequest({ status: 'start', id: requestID, async: true })(action));
                expect(next).not.toHaveBeenCalled();
                expect(res).toEqual({ type: 'success', data: payload });
                expect(tracker.requests.size).toBe(0);
            });

            test('should process if revalidate is `true` and cached result', () => {
                getState.mockReturnValue(cachedState);
                const res = apply(
                    withRequest({
                        status: 'start',
                        id: requestID,
                        async: true,
                        revalidate: true,
                    })(action)
                );

                expect(next).toHaveBeenCalledTimes(1);
                expect(res).toBeInstanceOf(Promise);
                expect(res).toEqual(tracker.requests.get(requestID));
                expect(tracker.requests.size).toBe(1);
            });

            test('should process if `maxAge` is exceeded', () => {
                getState.mockReturnValue(cachedState);
                getEpoch.mockReturnValueOnce(1_000);
                const res = apply(withRequest({ status: 'start', id: requestID, async: true })(action));
                expect(next).toHaveBeenCalledTimes(1);
                expect(res).toBeInstanceOf(Promise);
                expect(tracker.requests.size).toBe(1);
                expect(res).toEqual(tracker.requests.get(requestID));
            });

            test('should process if cache is invalid', () => {
                const invalidCache = { request: { [requestID]: { status: 'success', data: payload } } };
                getState.mockReturnValue(invalidCache);
                const res = apply(withRequest({ status: 'start', id: requestID, async: true })(action));
                expect(next).toHaveBeenCalledTimes(1);
                expect(res).toBeInstanceOf(Promise);
            });
        });
    });

    describe('request `success`', () => {
        test('should resolve pending promise with success payload', async () => {
            const res = tracker.push(requestID);
            apply(withRequest({ status: 'success', id: requestID })(action));

            expect(await res).toEqual({ type: 'success', data: payload });
            expect(tracker.requests.size).toBe(0);
            expect(next).toHaveBeenCalledTimes(1);
        });

        test('should handle success resolution without payload', async () => {
            const res = tracker.push(requestID);
            apply(withRequest({ status: 'success', id: requestID })({ type: 'test-action' }));
            expect(next).toHaveBeenCalledTimes(1);
            expect(await res).toEqual({ type: 'success', data: undefined });
        });

        test('should ignore resolution for unknown requestId', () => {
            apply(withRequest({ status: 'success', id: 'unknown' })(action));
            expect(next).toHaveBeenCalledTimes(1);
            expect(tracker.requests.size).toBe(0);
        });
    });

    describe('request `failure`', () => {
        test('should resolve pending promise with failure error', async () => {
            const res = tracker.push(requestID);
            apply(withRequest({ status: 'failure', id: requestID })(actionFailure));

            expect(await res).toEqual({ type: 'failure', error });
            expect(tracker.requests.size).toBe(0);
            expect(next).toHaveBeenCalledTimes(1);
        });

        test('should clean up if pending promise throws', async () => {
            void tracker.push(requestID).catch(noop);
            tracker.requests.get(requestID)?.reject(new Error());
            expect(tracker.requests.size).toBe(0);
        });
    });
});
