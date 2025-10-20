import * as time from '@proton/pass/utils/time/epoch';

import { requestInvalidate, requestProgress } from './actions';
import { withRequest } from './enhancers';
import reducer from './reducer';

describe('reducer', () => {
    jest.spyOn(time, 'getEpoch').mockImplementation(() => 0);
    const requestID = 'test-request';
    const data = { value: 'test' };
    const action = { type: 'TEST_ACTION', payload: data };

    describe('start status', () => {
        test('should initialize request state', () => {
            const request = { status: 'start', id: requestID } as const;
            const state = reducer(undefined, withRequest(request)(action));
            expect(state).toEqual({ [requestID]: { status: 'start', progress: 0 } });
        });

        test('should allow setting `data` on request state', () => {
            const request = { status: 'start', id: requestID, data } as const;
            const state = reducer(undefined, withRequest(request)(action));
            expect(state).toEqual({ [requestID]: { status: 'start', data, progress: 0 } });
        });
    });

    describe('progress status', () => {
        test('should update `progress` when request is ongoing', () => {
            const initial = { [requestID]: { status: 'start', progress: 0 } } as const;
            const state = reducer(initial, withRequest({ status: 'progress', id: requestID, progress: 0.5 })(action));
            expect(state).toEqual({ [requestID]: { status: 'start', progress: 0.5 } });
        });

        test('should ignore `progress` if request is not ongoing', () => {
            const initial = { [requestID]: { status: 'success', requestedAt: 0 } } as const;
            const state = reducer(initial, withRequest({ status: 'progress', id: requestID, progress: 0.5 })(action));
            expect(state).toEqual(initial);
        });
    });

    describe('failure status', () => {
        test('should remove request from state', () => {
            const initial = { [requestID]: { status: 'start', progress: 0, data } } as const;
            const state = reducer(initial, withRequest({ status: 'failure', id: requestID })(action));
            expect(state).toEqual({});
        });
    });

    describe('success status', () => {
        test('should remove request if no `maxAge`', () => {
            const initial = { [requestID]: { status: 'start', progress: 1, data } } as const;
            const state = reducer(initial, withRequest({ status: 'success', id: requestID })(action));
            expect(state).toEqual({});
        });

        test('should store request with maxAge', () => {
            const initial = { [requestID]: { status: 'start', progress: 1 } } as const;
            const request = withRequest({ status: 'success', id: requestID, maxAge: 100, data })(action);
            const state = reducer(initial, request);
            expect(state).toEqual({ [requestID]: { status: 'success', maxAge: 100, requestedAt: 0, data, hot: false } });
        });

        test('should use action payload if no request data', () => {
            const state = reducer({}, withRequest({ status: 'success', id: requestID, maxAge: 100 })(action));
            expect(state).toEqual({ [requestID]: { status: 'success', maxAge: 100, requestedAt: 0, data, hot: false } });
        });
    });

    describe('progress action', () => {
        test('should update progress for ongoing request', () => {
            const initial = { [requestID]: { status: 'start', progress: 0 } } as const;
            const state = reducer(initial, requestProgress(requestID, 0.5));
            expect(state).toEqual({ [requestID]: { status: 'start', progress: 0.5 } });
        });

        test('should ignore progress for non-ongoing request', () => {
            const initial = { [requestID]: { status: 'success', requestedAt: 0, data } } as const;
            const state = reducer(initial, requestProgress(requestID, 0.5));
            expect(state).toEqual(initial);
        });
    });

    describe('invalidate action', () => {
        test('should remove request from state', () => {
            const initial = { [requestID]: { status: 'success', data, requestedAt: 0 } as const };
            const state = reducer(initial, requestInvalidate(requestID));
            expect(state).toEqual({});
        });
    });
});
