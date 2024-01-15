import { RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import * as time from '@proton/shared/lib/helpers/promise';

import { createRefreshHandler } from './refresh';
import { TEST_SERVER_TIME, mockAPIResponse } from './testing';

const { TOO_MANY_REQUESTS } = HTTP_ERROR_CODES;

describe('Refresh handlers', () => {
    jest.useFakeTimers().setSystemTime(TEST_SERVER_TIME);

    const call = jest.fn();
    const onRefresh = jest.fn();
    const getAuth = jest.fn();
    const wait = jest.spyOn(time, 'wait').mockImplementation(() => Promise.resolve());

    beforeEach(() => {
        call.mockClear();
        onRefresh.mockClear();
        getAuth.mockClear();
        wait.mockClear();
    });

    test('should throw InactiveSession error if no auth', () => {
        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        expect(() => refresh(new Date())).toThrow('Inactive session');
    });

    test('should call refresh', async () => {
        getAuth.mockReturnValue({ AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' });
        call.mockResolvedValue(mockAPIResponse({ RefreshToken: 'refresh-001' }));
        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        await refresh(TEST_SERVER_TIME);

        expect(call).toHaveBeenCalledTimes(1);
        const [args] = call.mock.calls[0];

        expect(args.data).toEqual({
            GrantType: 'refresh_token',
            RedirectURI: 'https://protonmail.com',
            RefreshToken: 'refresh-000',
            ResponseType: 'token',
        });

        expect(args.headers['x-pm-uid']).toEqual('id-000');

        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(onRefresh).toHaveBeenCalledWith({ RefreshToken: 'refresh-001', RefreshTime: +TEST_SERVER_TIME });
    });

    test('should call refresh only once concurrently', async () => {
        getAuth.mockReturnValue({ AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' });
        call.mockResolvedValue(mockAPIResponse({ RefreshToken: 'refresh-001' }));
        const refresh = createRefreshHandler({ call, getAuth, onRefresh });

        await Promise.all([refresh(TEST_SERVER_TIME), refresh(TEST_SERVER_TIME), refresh(TEST_SERVER_TIME)]);
        expect(call).toHaveBeenCalledTimes(1);
        expect(onRefresh).toHaveBeenCalledTimes(1);

        await refresh(TEST_SERVER_TIME);
        expect(call).toHaveBeenCalledTimes(2);
        expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    test('should not refresh if last refresh time is greater than request to refresh', async () => {
        getAuth.mockReturnValue({
            AccessToken: 'access-000',
            UID: 'id-000',
            RefreshToken: 'refresh-000',
            RefreshTime: +TEST_SERVER_TIME + 10,
        });
        call.mockResolvedValue(mockAPIResponse({ RefreshToken: 'refresh-001' }));
        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        await refresh(new Date(+TEST_SERVER_TIME));

        expect(call).not.toHaveBeenCalled();
        expect(onRefresh).not.toHaveBeenCalled();
    });

    test('should not retry if timeout error', async () => {
        const timeoutError = new Error();
        timeoutError.name = 'TimeoutError';
        getAuth.mockReturnValue({ AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' });
        call.mockRejectedValueOnce(timeoutError);

        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        await expect(refresh(new Date())).rejects.toThrow();

        expect(call).toHaveBeenCalledTimes(1);
        expect(onRefresh).not.toHaveBeenCalled();
    });

    test('should not retry if offline error', async () => {
        const offlineError = new Error();
        offlineError.name = 'OfflineError';
        getAuth.mockReturnValue({ AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' });
        call.mockRejectedValueOnce(offlineError);

        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        await expect(refresh(new Date())).rejects.toThrow();

        expect(call).toHaveBeenCalledTimes(1);
        expect(onRefresh).not.toHaveBeenCalled();
    });

    test('should retry if `retry-after` header present', async () => {
        getAuth.mockReturnValue({ AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' });

        call.mockRejectedValueOnce(mockAPIResponse({}, TOO_MANY_REQUESTS, { 'retry-after': '10' }));
        call.mockResolvedValueOnce(mockAPIResponse({ RefreshToken: 'refresh-001' }));

        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        await refresh(new Date());

        expect(call).toHaveBeenCalledTimes(2);
        expect(onRefresh).toHaveBeenCalledTimes(1);
        expect(onRefresh).toHaveBeenCalledWith({ RefreshToken: 'refresh-001', RefreshTime: +TEST_SERVER_TIME });
    });

    test('should stop retrying after `maxAttempts` is reached', async () => {
        getAuth.mockReturnValue({ AccessToken: 'access-000', UID: 'id-000', RefreshToken: 'refresh-000' });
        call.mockRejectedValue(mockAPIResponse({}, TOO_MANY_REQUESTS, { 'retry-after': '10' }));

        const refresh = createRefreshHandler({ call, getAuth, onRefresh });
        await expect(refresh(new Date())).rejects.toBeTruthy();
        expect(call).toHaveBeenCalledTimes(RETRY_ATTEMPTS_MAX);
        expect(onRefresh).not.toHaveBeenCalled();
    });
});
