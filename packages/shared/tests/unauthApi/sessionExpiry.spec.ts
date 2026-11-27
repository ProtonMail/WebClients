import { auth, createSession, setCookies, setRefreshCookies } from '../../lib/api/auth';
import { HTTP_ERROR_CODES } from '../../lib/errors';
import { ApiError } from '../../lib/fetch/ApiError';
import { getUIDHeaderValue } from '../../lib/fetch/headers';
import { removeItem } from '../../lib/helpers/sessionStorage';
import { createUnauthenticatedApi } from '../../lib/unauthApi/unAuthenticatedApi';

const expiredUID = 'expired-uid';
const newUID = 'new-uid';
const thirdUID = 'third-uid';

// With a body like the API's, which has an error code
const apiError = (status: number) =>
    Object.assign(new ApiError('', status, 'ApiError'), { data: { Code: status, Error: 'Error' } });
const unauthorized = apiError(HTTP_ERROR_CODES.UNAUTHORIZED);
const unprocessable = apiError(HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY);

const refuseRefresh = () => Promise.reject(new ApiError('', HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY, 'ApiError'));

// Answers the session setup, and by default refuses every refresh, like the API for a session that is gone. Everything
// else goes to the handler, with the session the request went out on.
const setupUnauthenticatedApi = (
    handler: (url: string, UID: string | undefined) => Promise<unknown>,
    refresh: () => Promise<unknown> = refuseRefresh
) => {
    removeItem('ua_uid');
    const UIDs = [expiredUID, newUID, thirdUID];
    const api = vi.fn((config: any) => {
        if (config.url === createSession().url) {
            const UID = UIDs.shift();
            return Promise.resolve({
                json: () => Promise.resolve({ UID, AccessToken: 'access-token', RefreshToken: 'refresh-token' }),
            });
        }
        if (config.url === setCookies({ UID: '', RefreshToken: '', State: '' }).url) {
            return Promise.resolve({});
        }
        if (config.url === setRefreshCookies().url) {
            return refresh();
        }
        return handler(config.url, getUIDHeaderValue(config.headers));
    });
    const unauthenticatedApi = createUnauthenticatedApi(api as any);
    // Otherwise the session setup waits for the challenge payload
    unauthenticatedApi.setChallenge(undefined);
    const refreshes = () => api.mock.calls.filter(([config]) => config.url === setRefreshCookies().url);
    const sessions = () => api.mock.calls.filter(([config]) => config.url === createSession().url);
    return { unauthenticatedApi, refreshes, sessions };
};

describe('unauthenticated api session expiry', () => {
    it('should fail the request without sending it when the session cannot be created', async () => {
        removeItem('ua_uid');
        const unavailable = apiError(HTTP_ERROR_CODES.SERVICE_UNAVAILABLE);
        const api = vi.fn((config: any) =>
            config.url === createSession().url ? Promise.reject(unavailable) : Promise.resolve('ok')
        );
        const unauthenticatedApi = createUnauthenticatedApi(api as any);
        unauthenticatedApi.setChallenge(undefined);

        await expect(unauthenticatedApi.apiCallback({ url: 'start' })).rejects.toBe(unavailable);
        expect(api.mock.calls.map(([config]) => config.url)).toEqual([createSession().url]);
    });

    it('should send the requests of a session that never answered again on a new session', async () => {
        const { unauthenticatedApi, refreshes } = setupUnauthenticatedApi((_, UID) =>
            UID === expiredUID ? Promise.reject(unauthorized) : Promise.resolve('ok')
        );
        const onSessionExpired = vi.fn();
        unauthenticatedApi.onSessionExpired(onSessionExpired);

        await expect(unauthenticatedApi.apiCallback({ url: 'start' })).resolves.toBe('ok');
        expect(unauthenticatedApi.getUID()).toBe(newUID);
        expect(onSessionExpired).not.toHaveBeenCalled();
        expect(refreshes()).toHaveLength(0);
    });

    it('should not replace the new session too when it fails before answering, like when the browser blocks its cookies', async () => {
        const { unauthenticatedApi, sessions } = setupUnauthenticatedApi(() => Promise.reject(unauthorized));

        await expect(unauthenticatedApi.apiCallback({ url: 'start' })).rejects.toBe(unauthorized);
        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).rejects.toBe(unauthorized);
        expect(unauthenticatedApi.getUID()).toBe(newUID);
        expect(sessions()).toHaveLength(2);
    });

    it('should not replace the new session for a 401 that comes back right after it replaced one that never answered', async () => {
        const { unauthenticatedApi, sessions } = setupUnauthenticatedApi(() => Promise.reject(unauthorized));

        const start = unauthenticatedApi.apiCallback({ url: 'start' });
        await vi.waitFor(() => expect(unauthenticatedApi.getUID()).toBe(newUID), { interval: 1 });
        await expect(unauthenticatedApi.apiCallback({ url: 'other' })).rejects.toBe(unauthorized);
        await expect(start).rejects.toBe(unauthorized);
        expect(sessions()).toHaveLength(2);
    });

    it('should still replace the new session when it fails after it answered', async () => {
        let newSessionExpired = false;
        const { unauthenticatedApi, sessions } = setupUnauthenticatedApi((_, UID) =>
            UID === expiredUID || (newSessionExpired && UID === newUID)
                ? Promise.reject(unauthorized)
                : Promise.resolve('ok')
        );
        const onSessionExpired = vi.fn();
        unauthenticatedApi.onSessionExpired(onSessionExpired);

        await expect(unauthenticatedApi.apiCallback({ url: 'start' })).resolves.toBe('ok');
        newSessionExpired = true;

        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).rejects.toBe(unauthorized);
        expect(onSessionExpired).toHaveBeenCalledTimes(1);
        expect(unauthenticatedApi.getUID()).toBe(thirdUID);
        expect(sessions()).toHaveLength(3);
    });

    it('should still replace the new session when the API only answered it with errors, and it fails later', async () => {
        let newSessionExpired = false;
        const { unauthenticatedApi, sessions } = setupUnauthenticatedApi((_, UID) =>
            UID === expiredUID || (newSessionExpired && UID === newUID)
                ? Promise.reject(unauthorized)
                : Promise.reject(unprocessable)
        );

        await expect(unauthenticatedApi.apiCallback({ url: 'start' })).rejects.toBe(unprocessable);
        newSessionExpired = true;

        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).rejects.toBe(unprocessable);
        expect(unauthenticatedApi.getUID()).toBe(thirdUID);
        expect(sessions()).toHaveLength(3);
    });

    it('should fail the requests of a session that answered, and tell the flows, without refreshing it', async () => {
        let expired = false;
        const { unauthenticatedApi, refreshes } = setupUnauthenticatedApi((_, UID) =>
            expired && UID === expiredUID ? Promise.reject(unauthorized) : Promise.resolve('ok')
        );
        const onSessionExpired = vi.fn();
        unauthenticatedApi.onSessionExpired(onSessionExpired);

        await unauthenticatedApi.apiCallback({ url: 'start' });
        expired = true;

        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).rejects.toBe(unauthorized);
        expect(onSessionExpired).toHaveBeenCalledTimes(1);
        // The next request runs on a new session
        expect(unauthenticatedApi.getUID()).toBe(newUID);
        // The API keeps no record of a session that never signed in
        expect(refreshes()).toHaveLength(0);
    });

    it('should refresh a signed in session whose access token expired, and send its request again on it', async () => {
        let accessTokenExpired = false;
        const { unauthenticatedApi, refreshes } = setupUnauthenticatedApi(
            (_, UID) =>
                accessTokenExpired && UID === expiredUID ? Promise.reject(unauthorized) : Promise.resolve('ok'),
            () => {
                accessTokenExpired = false;
                return Promise.resolve({});
            }
        );
        const onSessionExpired = vi.fn();
        unauthenticatedApi.onSessionExpired(onSessionExpired);

        await unauthenticatedApi.apiCallback(auth({ Username: 'user' }, false));
        accessTokenExpired = true;

        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).resolves.toBe('ok');
        expect(refreshes()).toHaveLength(1);
        // The flows keep what they did on it
        expect(unauthenticatedApi.getUID()).toBe(expiredUID);
        expect(onSessionExpired).not.toHaveBeenCalled();
    });

    it('should fail the requests of a signed in session that can no longer be refreshed', async () => {
        let expired = false;
        const { unauthenticatedApi, refreshes } = setupUnauthenticatedApi((_, UID) =>
            expired && UID === expiredUID ? Promise.reject(unauthorized) : Promise.resolve('ok')
        );
        const onSessionExpired = vi.fn();
        unauthenticatedApi.onSessionExpired(onSessionExpired);

        await unauthenticatedApi.apiCallback(auth({ Username: 'user' }, false));
        expired = true;

        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).rejects.toBe(unauthorized);
        expect(refreshes()).toHaveLength(1);
        expect(onSessionExpired).toHaveBeenCalledTimes(1);
        expect(unauthenticatedApi.getUID()).toBe(newUID);
    });

    it('should replace the session once for 401s that come in at the same time', async () => {
        let expired = false;
        const { unauthenticatedApi } = setupUnauthenticatedApi((_, UID) =>
            expired && UID === expiredUID ? Promise.reject(unauthorized) : Promise.resolve('ok')
        );
        const onSessionExpired = vi.fn();
        unauthenticatedApi.onSessionExpired(onSessionExpired);
        await unauthenticatedApi.apiCallback({ url: 'start' });
        expired = true;

        const results = await Promise.allSettled([
            unauthenticatedApi.apiCallback({ url: 'a' }),
            unauthenticatedApi.apiCallback({ url: 'b' }),
        ]);

        expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
        // A second replacement would have switched to the third session
        expect(unauthenticatedApi.getUID()).toBe(newUID);
        expect(onSessionExpired).toHaveBeenCalledTimes(1);
    });

    it('should not replace the new session for a late 401 from the expired one', async () => {
        let expired = false;
        let failLate = () => {};
        const { unauthenticatedApi } = setupUnauthenticatedApi((url, UID) => {
            if (url === 'late') {
                return new Promise((_, reject) => {
                    failLate = () => reject(unauthorized);
                });
            }
            return expired && UID === expiredUID ? Promise.reject(unauthorized) : Promise.resolve('ok');
        });

        await unauthenticatedApi.apiCallback({ url: 'start' });
        const late = unauthenticatedApi.apiCallback({ url: 'late' });
        expired = true;
        await expect(unauthenticatedApi.apiCallback({ url: 'continue' })).rejects.toBe(unauthorized);

        failLate();
        await expect(late).rejects.toBe(unauthorized);
        expect(unauthenticatedApi.getUID()).toBe(newUID);
    });
});
