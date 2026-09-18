import { createSession, setCookies } from '../../lib/api/auth';
import type { ApiEvent } from '../../lib/api/createApi';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '../../lib/errors';
import { ApiError } from '../../lib/fetch/ApiError';
import { getUIDHeaderValue } from '../../lib/fetch/headers';
import { removeItem } from '../../lib/helpers/sessionStorage';
import { createUnauthenticatedApi } from '../../lib/unauthApi/unAuthenticatedApi';

const UID = 'unauth-uid';

const getHumanVerificationError = () => {
    const error = new ApiError('', 422, 'ApiError');
    error.data = {
        Code: API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED,
        Error: 'Human verification required',
        Details: { HumanVerificationToken: 'hv-token', HumanVerificationMethods: ['email'] },
    };
    return error;
};

// Answers the session setup, and delegates everything else to the given handler
const createBaseApi = (handler: (config: any) => any) => {
    return vi.fn((config: any) => {
        if (config.url === createSession().url) {
            return Promise.resolve({
                json: () => Promise.resolve({ UID, AccessToken: 'access-token', RefreshToken: 'refresh-token' }),
            });
        }
        if (config.url === setCookies({ UID, RefreshToken: '', State: '' }).url) {
            return Promise.resolve({});
        }
        return handler(config);
    });
};

const setupUnauthenticatedApi = (handler: (config: any) => any) => {
    removeItem('ua_uid');
    const api = createBaseApi(handler);
    const unauthenticatedApi = createUnauthenticatedApi(api as any);
    // Otherwise the session setup waits for the challenge payload
    unauthenticatedApi.setChallenge(undefined);
    return { api, unauthenticatedApi };
};

describe('unauthenticated api human verification', () => {
    it('should emit the challenge to its own listeners rather than to the app handler', async () => {
        const { api, unauthenticatedApi } = setupUnauthenticatedApi((config) => {
            // Only the retry carries verification headers
            if (config.headers?.['x-pm-human-verification-token']) {
                return Promise.resolve('verified');
            }
            return Promise.reject(getHumanVerificationError());
        });

        const events: ApiEvent[] = [];
        unauthenticatedApi.addEventListener((event) => {
            events.push(event);
            if (event.type !== 'handle-verification') {
                return false;
            }
            void event.payload.onVerify('123456', 'email').then(event.payload.resolve, event.payload.reject);
            return true;
        });

        const result = await unauthenticatedApi.apiCallback({ url: 'send-code' });

        expect(result).toBe('verified');
        const [event] = events;
        expect(event.type).toBe('handle-verification');
        expect(event.type === 'handle-verification' && event.payload.token).toBe('hv-token');
        // The app handler is opted out of, so the request itself asks to be left alone
        const [config] = api.mock.calls[api.mock.calls.length - 2];
        expect(config.ignoreHandler).toContain(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED);
        expect(config.silence).toContain(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED);
    });

    it('should retry on the session that got challenged', async () => {
        const { api, unauthenticatedApi } = setupUnauthenticatedApi((config) => {
            if (config.headers?.['x-pm-human-verification-token']) {
                return Promise.resolve('verified');
            }
            return Promise.reject(getHumanVerificationError());
        });

        unauthenticatedApi.addEventListener((event) => {
            if (event.type !== 'handle-verification') {
                return false;
            }
            void event.payload.onVerify('123456', 'email').then(event.payload.resolve, event.payload.reject);
            return true;
        });

        await unauthenticatedApi.apiCallback({ url: 'send-code' });

        const [retry] = api.mock.calls[api.mock.calls.length - 1];
        expect(getUIDHeaderValue(retry.headers)).toBe(UID);
        expect(retry.headers['x-pm-human-verification-token']).toBe('123456');
        expect(retry.headers['x-pm-human-verification-token-type']).toBe('email');
    });

    it('should leave the challenge to the app level handler when nothing is listening', async () => {
        const error = getHumanVerificationError();
        const { api, unauthenticatedApi } = setupUnauthenticatedApi(() => Promise.reject(error));

        await expect(unauthenticatedApi.apiCallback({ url: 'send-code' })).rejects.toBe(error);

        // Otherwise a caller using this api without a host mounted for it gets no challenge at all
        const [config] = api.mock.calls[api.mock.calls.length - 1];
        expect(config.ignoreHandler).not.toContain(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED);
        expect(config.silence).not.toContain(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED);
    });

    it('should not handle the challenge when the caller opted out of it', async () => {
        const error = getHumanVerificationError();
        const { unauthenticatedApi } = setupUnauthenticatedApi(() => Promise.reject(error));

        const handleEvent = vi.fn(() => true);
        unauthenticatedApi.addEventListener(handleEvent);

        await expect(
            unauthenticatedApi.apiCallback({
                url: 'send-code',
                ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
            })
        ).rejects.toBe(error);
        expect(handleEvent).not.toHaveBeenCalled();
    });

    it('should keep handling 401 on the session', async () => {
        const error = new ApiError('', HTTP_ERROR_CODES.UNAUTHORIZED, 'ApiError');
        let sendCodeCalls = 0;
        const { unauthenticatedApi } = setupUnauthenticatedApi((config) => {
            if (config.url !== 'send-code') {
                // The refresh call
                return Promise.resolve('refreshed');
            }
            sendCodeCalls += 1;
            return sendCodeCalls === 1 ? Promise.reject(error) : Promise.resolve('ok');
        });

        await expect(unauthenticatedApi.apiCallback({ url: 'send-code' })).resolves.toBe('ok');
        expect(sendCodeCalls).toBe(2);
    });
});
