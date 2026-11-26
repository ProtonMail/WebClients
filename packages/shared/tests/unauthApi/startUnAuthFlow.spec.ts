import { createSession, revoke, setCookies } from '../../lib/api/auth';
import { resetNonPrivateMember, validateResetToken } from '../../lib/api/reset';
import { getUIDHeaderValue } from '../../lib/fetch/headers';
import { removeItem } from '../../lib/helpers/sessionStorage';
import { createUnauthenticatedApi } from '../../lib/unauthApi/unAuthenticatedApi';

const firstUID = 'first-uid';
const secondUID = 'second-uid';

const setupUnauthenticatedApi = () => {
    removeItem('ua_uid');
    const UIDs = [firstUID, secondUID];
    const api = vi.fn((config: any) => {
        if (config.url === createSession().url) {
            return Promise.resolve({
                json: () => Promise.resolve({ UID: UIDs.shift(), AccessToken: 'access', RefreshToken: 'refresh' }),
            });
        }
        if (config.url === setCookies({ UID: '', RefreshToken: '', State: '' }).url) {
            return Promise.resolve({});
        }
        return Promise.resolve({ UID: getUIDHeaderValue(config.headers) });
    });
    const unauthenticatedApi = createUnauthenticatedApi(api as any);
    unauthenticatedApi.setChallenge(undefined);
    const revokedUIDs = () =>
        api.mock.calls
            .filter(([config]) => config.url === revoke().url)
            .map(([config]) => getUIDHeaderValue(config.headers));
    return { unauthenticatedApi, revokedUIDs };
};

describe('unauthenticated api startUnAuthFlow', () => {
    it('keeps a session that no request tied to a user', async () => {
        const { unauthenticatedApi, revokedUIDs } = setupUnauthenticatedApi();
        await unauthenticatedApi.apiCallback(validateResetToken('member', 'token'));

        await unauthenticatedApi.startUnAuthFlow();

        expect(unauthenticatedApi.getUID()).toBe(firstUID);
        expect(revokedUIDs()).toEqual([]);
    });

    it('replaces a session that a non-private member reset tied to the member', async () => {
        const { unauthenticatedApi, revokedUIDs } = setupUnauthenticatedApi();
        await unauthenticatedApi.apiCallback(resetNonPrivateMember({ Username: 'member', Token: 'token' }));

        await unauthenticatedApi.startUnAuthFlow();
        await unauthenticatedApi.apiCallback(validateResetToken('member', 'new-token'));

        expect(revokedUIDs()).toEqual([firstUID]);
        expect(unauthenticatedApi.getUID()).toBe(secondUID);
    });
});
