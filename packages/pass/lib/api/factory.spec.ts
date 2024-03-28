import type { ApiAuth, Maybe } from '@proton/pass/types';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';

import { LockedSessionError, PassErrorCode } from './errors';
import { createApi } from './factory';
import * as refresh from './refresh';
import { TEST_SERVER_TIME, mockAPIResponse } from './testing';

const { APP_VERSION_BAD } = API_CUSTOM_ERROR_CODES;

const asyncNextTick = () => new Promise(process.nextTick);

describe('API factory', () => {
    const config = { APP_NAME: 'proton-pass', APP_VERSION: '0.0.1-test', API_URL: 'https://test.api' } as ProtonConfig;
    const refreshMock = jest.fn(() => Promise.resolve({}));
    jest.spyOn(refresh, 'refreshHandlerFactory');
    const refreshHandleFactorySpy = refresh.refreshHandlerFactory as unknown as jest.SpyInstance;

    const fetchMock = jest.fn<Promise<Response>, [url: string, options: any], any>(() =>
        Promise.resolve(mockAPIResponse())
    );

    refreshHandleFactorySpy.mockImplementation(
        ({ onRefresh }) =>
            async () =>
                onRefresh(await refreshMock())
    );

    let auth: Maybe<ApiAuth> = undefined;
    const getAuth = jest.fn().mockImplementation(() => auth);
    const listener = jest.fn();

    (global as any).fetch = fetchMock;
    const api = createApi({ config, getAuth });

    beforeEach(async () => {
        auth = undefined;
        api.unsubscribe();
        await api.reset();
        api.subscribe(listener);
        listener.mockClear();
        fetchMock.mockClear();
        refreshMock.mockClear();
    });

    describe('Factory', () => {
        test('should create initial API state', () => {
            expect(api.getState()).toEqual({
                appVersionBad: false,
                online: true,
                pendingCount: 0,
                queued: [],
                refreshing: false,
                serverTime: undefined,
                sessionInactive: false,
                sessionLocked: false,
                unreachable: false,
            });
        });

        test('should keep track of pending requests', async () => {
            const resolvers: ((res: Response) => void)[] = [];

            fetchMock
                .mockImplementationOnce(() => new Promise<Response>((res) => resolvers.push(res)))
                .mockImplementationOnce(() => new Promise<Response>((res) => resolvers.push(res)))
                .mockImplementationOnce(() => new Promise<Response>((res) => resolvers.push(res)));

            expect(api.getState().pendingCount).toEqual(0);

            const call1 = api({}).then(asyncNextTick);
            const call2 = api({}).then(asyncNextTick);
            const call3 = api({}).then(asyncNextTick);

            await asyncNextTick();

            expect(api.getState().pendingCount).toEqual(3);
            resolvers[0](mockAPIResponse());
            await call1;
            expect(api.getState().pendingCount).toEqual(2);

            resolvers[1](mockAPIResponse());
            await call2;
            expect(api.getState().pendingCount).toEqual(1);

            resolvers[2](mockAPIResponse());
            await call3;
            expect(api.getState().pendingCount).toEqual(0);
        });

        test('should support request treshold', async () => {
            const backPressuredApi = createApi({ config, getAuth, threshold: 1 });
            const resolvers: ((res: Response) => void)[] = [];

            fetchMock
                .mockImplementationOnce(() => new Promise<Response>((res) => resolvers.push(res)))
                .mockImplementationOnce(() => new Promise<Response>((res) => resolvers.push(res)))
                .mockImplementationOnce(() => new Promise<Response>((res) => resolvers.push(res)));

            const call1 = backPressuredApi({}).then(asyncNextTick);
            const call2 = backPressuredApi({}).then(asyncNextTick);
            const call3 = backPressuredApi({}).then(asyncNextTick);

            await asyncNextTick();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(backPressuredApi.getState().pendingCount).toEqual(3);

            resolvers[0](mockAPIResponse());
            await call1;
            expect(fetchMock).toHaveBeenCalledTimes(2);

            resolvers[1](mockAPIResponse());
            await call2;
            expect(fetchMock).toHaveBeenCalledTimes(3);

            resolvers[2](mockAPIResponse());
            await call3;
        });
    });

    describe('Server time', () => {
        test('should be set on API call', async () => {
            expect(api.getState().serverTime).toEqual(undefined);
            await api({ url: 'some/endpoint' });
            expect(api.getState().serverTime).toEqual(TEST_SERVER_TIME);
        });

        test('should throw if no date header response', async () => {
            fetchMock.mockResolvedValueOnce(mockAPIResponse({}, 200, {}));
            await expect(api({})).rejects.toThrow('Could not fetch server time');
        });
    });

    describe('Response', () => {
        test('should support JSON response', async () => {
            const json = { id: Math.random() };
            fetchMock.mockResolvedValueOnce(mockAPIResponse(json, 200));
            expect(await api({ url: 'endpoint', output: 'json' })).toEqual(json);
        });

        test('should support RAW response', async () => {
            const response = mockAPIResponse({ id: Math.random() }, 200);
            fetchMock.mockResolvedValueOnce(response);
            expect(await api({ url: 'endpoint', output: 'raw' })).toEqual(response);
        });

        test('should support STREAM response', async () => {
            const response = mockAPIResponse({ id: Math.random() }, 200);
            fetchMock.mockResolvedValueOnce(response);
            expect(await api({ url: 'endpoint', output: 'stream' })).toEqual(response.body);
        });
    });

    describe('Authentication', () => {
        test('should allow authenticated requests', async () => {
            auth = { AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' };
            await api({ url: 'some/endpoint' });
            const [url, { headers }] = fetchMock.mock.lastCall!;

            expect(url.toString()).toEqual('https://test.api/some/endpoint');
            expect(headers.Authorization).toEqual(`Bearer ${auth.AccessToken}`);
            expect(headers['x-pm-uid']).toEqual(auth.UID);
            expect(headers['x-pm-appversion']).toEqual('web-pass@0.0.1-dev');
        });

        test('should allow unauthenticated requests', async () => {
            await api({ url: 'some/public/endpoint' });
            const [url, { headers }] = fetchMock.mock.lastCall!;
            expect(url.toString()).toEqual('https://test.api/some/public/endpoint');
            expect(headers.Authorization).toBeUndefined();
            expect(headers['x-pm-uid']).toBeUndefined();
            expect(headers['x-pm-appversion']).toEqual('web-pass@0.0.1-dev');
        });
    });

    describe('Locked session', () => {
        test('should handle locked session', async () => {
            fetchMock.mockResolvedValueOnce(
                mockAPIResponse(
                    {
                        Code: PassErrorCode.SESSION_LOCKED,
                        Error: 'Locked',
                    },
                    422
                )
            );

            await expect(api({ url: 'some/protected/endpoint' })).rejects.toThrow(LockedSessionError());
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ status: 'locked', type: 'session' });
            expect(api.getState().sessionLocked).toEqual(true);
        });

        test('all subsequent calls should fail early', async () => {
            fetchMock.mockResolvedValueOnce(
                mockAPIResponse(
                    {
                        Code: PassErrorCode.SESSION_LOCKED,
                        Error: 'Locked',
                    },
                    422
                )
            );

            await expect(api({ url: 'some/protected/endpoint' })).rejects.toThrow(LockedSessionError());
            await expect(api({ url: 'some/other/endpoint' })).rejects.toThrow(LockedSessionError());
            await expect(api({ url: 'some/other/endpoint' })).rejects.toThrow(LockedSessionError());
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('Inactive session', () => {
        test('should handle inactive session', async () => {
            refreshMock.mockRejectedValueOnce(InactiveSessionError());
            fetchMock.mockResolvedValueOnce(mockAPIResponse({}, 401));
            await expect(api({ url: 'some/protected/endpoint' })).rejects.toThrow(InactiveSessionError());
            expect(listener).toHaveBeenCalledTimes(2);
            expect(listener.mock.calls[0][0]).toEqual({ status: 'inactive', type: 'session' });
            expect(listener.mock.calls[1][0]).toEqual({ type: 'error', error: 'Session timed out' });
            expect(api.getState().sessionInactive).toEqual(true);
        });

        test('all subsequent calls should fail early', async () => {
            refreshMock.mockRejectedValueOnce(InactiveSessionError());
            fetchMock.mockResolvedValueOnce(mockAPIResponse({}, 401));
            await expect(api({ url: 'some/protected/endpoint' })).rejects.toThrow(InactiveSessionError());
            await expect(api({ url: 'some/other/endpoint' })).rejects.toThrow(InactiveSessionError());
            await expect(api({ url: 'some/other/endpoint' })).rejects.toThrow(InactiveSessionError());
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        test('should try to refresh session', async () => {
            const response = { id: Math.random() };
            refreshMock.mockResolvedValueOnce({ RefreshToken: 'refresh-001' });

            fetchMock
                .mockResolvedValueOnce(mockAPIResponse({}, 401))
                .mockResolvedValueOnce(mockAPIResponse(response, 200));

            await expect(api({ url: 'some/protected/endpoint' })).resolves.toEqual(response);
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ type: 'refresh', data: { RefreshToken: 'refresh-001' } });
            expect(api.getState().sessionInactive).toEqual(false);
        });
    });

    describe('Errors', () => {
        test('should handle offline errors', async () => {
            fetchMock.mockRejectedValueOnce({ ok: false });
            await expect(api({})).rejects.toThrow('No network connection');
            expect(api.getState().online).toBe(false);
        });

        test('should handle unavailable service errors', async () => {
            fetchMock.mockResolvedValueOnce(mockAPIResponse({}, 503));
            await expect(api({})).rejects.toThrow(ApiError);
            expect(api.getState().unreachable).toBe(true);
        });

        test('should handle bad client version errors', async () => {
            fetchMock.mockResolvedValueOnce(mockAPIResponse({ Code: APP_VERSION_BAD, Error: 'Bad verson' }, 500));
            await expect(api({})).rejects.toThrow('App version outdated');
            expect(api.getState().appVersionBad).toBe(true);
        });
    });
});
