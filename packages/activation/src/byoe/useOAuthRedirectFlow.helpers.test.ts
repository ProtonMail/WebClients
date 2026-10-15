import {
    readOAuthCallback,
    readOAuthRedirectState,
    readOAuthSession,
    removeOAuthCallbackParams,
    storeOAuthRedirectState,
} from './useOAuthRedirectFlow.helpers';

const STORAGE_KEY = 'proton:oauth-redirect-state';

describe('useOAuthRedirectFlow helpers', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    describe('readOAuthRedirectState', () => {
        it('should return undefined when nothing is stored', () => {
            expect(readOAuthRedirectState()).toBeUndefined();
        });

        it('should return the stored state', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true, redirect: 'proton://done' });

            expect(readOAuthRedirectState()).toEqual({ uid: 'abc', importEmails: true, redirect: 'proton://done' });
        });

        it('should keep the expected email address of a reconnection', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: false, reconnectAddressID: 'address-id' });

            expect(readOAuthRedirectState()?.reconnectAddressID).toBe('address-id');
        });

        it('should drop an expected email address that is not a string', () => {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ uid: 'abc', importEmails: false, reconnectAddressID: 42 })
            );

            expect(readOAuthRedirectState()?.reconnectAddressID).toBeUndefined();
        });

        it('should drop a redirect that is not a string', () => {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ uid: 'abc', importEmails: false, redirect: 42 }));

            expect(readOAuthRedirectState()).toEqual({ uid: 'abc', importEmails: false, redirect: undefined });
        });

        it.each([
            ['invalid JSON', '{not json'],
            ['a missing uid', JSON.stringify({ importEmails: true })],
            ['a non-string uid', JSON.stringify({ uid: 1, importEmails: true })],
            ['a non-boolean importEmails', JSON.stringify({ uid: 'abc', importEmails: 'yes' })],
            ['null', 'null'],
        ])('should return undefined for %s', (_, raw) => {
            sessionStorage.setItem(STORAGE_KEY, raw);

            expect(readOAuthRedirectState()).toBeUndefined();
        });
    });

    describe('creationStartedAt', () => {
        it('should be stored and read back', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true, creationStartedAt: 1234 });

            expect(readOAuthRedirectState()?.creationStartedAt).toBe(1234);
        });

        it('should be dropped when it is not a number', () => {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ uid: 'abc', importEmails: true, creationStartedAt: '1234' })
            );

            expect(readOAuthRedirectState()?.creationStartedAt).toBeUndefined();
        });
    });

    describe('readOAuthCallback', () => {
        it('should return none and keep the stored state on an ordinary page load', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });

            expect(readOAuthCallback(new URLSearchParams('action=byoe-mobile'))).toEqual({ type: 'none' });
            expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
        });

        it('should return the code and stored state when state matches', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true, redirect: 'proton://done' });

            expect(readOAuthCallback(new URLSearchParams('code=123&state=abc'))).toEqual({
                type: 'code',
                code: '123',
                state: { uid: 'abc', importEmails: true, redirect: 'proton://done' },
            });
        });

        it('should return error when the user declined', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });

            expect(readOAuthCallback(new URLSearchParams('error=access_denied&state=abc'))).toEqual({
                type: 'error',
                state: { uid: 'abc', importEmails: true, redirect: undefined, creationStartedAt: undefined },
            });
        });

        it('should return error when state does not match', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });

            expect(readOAuthCallback(new URLSearchParams('code=123&state=other'))).toEqual({ type: 'error' });
        });

        it('should return error when no state was stored', () => {
            expect(readOAuthCallback(new URLSearchParams('code=123&state=abc'))).toEqual({ type: 'error' });
        });

        it('should return error when state is missing from the callback', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });

            expect(readOAuthCallback(new URLSearchParams('code=123'))).toEqual({ type: 'error' });
        });

        it('should make the stored state single use', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });
            const params = new URLSearchParams('code=123&state=abc');

            expect(readOAuthCallback(params).type).toBe('code');
            expect(readOAuthCallback(params)).toEqual({ type: 'error' });
        });

        it('should clear the stored state even when the callback is rejected', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });

            readOAuthCallback(new URLSearchParams('code=123&state=other'));

            expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        });
    });

    describe('removeOAuthCallbackParams', () => {
        it('should remove the provider params and keep the others', () => {
            const url = new URL(
                'https://account.proton.me/lite?action=byoe-mobile&code=1&state=a&scope=s&authuser=0&prompt=consent&hd=x.com&error=e'
            );

            expect(removeOAuthCallbackParams(url).toString()).toBe('https://account.proton.me/lite?action=byoe-mobile');
        });

        it('should not mutate the given URL', () => {
            const url = new URL('https://account.proton.me/lite?code=1');

            removeOAuthCallbackParams(url);

            expect(url.searchParams.get('code')).toBe('1');
        });
    });

    describe('readOAuthSession', () => {
        it('should return the session when state matches, without consuming it', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true, sessionUID: 'session', sessionLocalID: 3 });

            expect(readOAuthSession(new URLSearchParams('code=1&state=abc'))).toEqual({ UID: 'session', localID: 3 });
            expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();
        });

        it('should keep a local ID of 0', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true, sessionUID: 'session', sessionLocalID: 0 });

            expect(readOAuthSession(new URLSearchParams('code=1&state=abc'))).toEqual({ UID: 'session', localID: 0 });
        });

        it.each([
            ['missing', undefined],
            ['a string', '3'],
            ['not an integer', 1.5],
        ])('should return the UID without a local ID when it is %s', (_, sessionLocalID) => {
            sessionStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ uid: 'abc', importEmails: true, sessionUID: 'session', sessionLocalID })
            );

            expect(readOAuthSession(new URLSearchParams('code=1&state=abc'))).toEqual({
                UID: 'session',
                localID: undefined,
            });
        });

        it.each([
            ['state mismatch', 'code=1&state=other'],
            ['no state', 'action=byoe-mobile'],
        ])('should return undefined on %s', (_, query) => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true, sessionUID: 'session', sessionLocalID: 3 });

            expect(readOAuthSession(new URLSearchParams(query))).toBeUndefined();
        });

        it('should return undefined when no session was stored', () => {
            storeOAuthRedirectState({ uid: 'abc', importEmails: true });

            expect(readOAuthSession(new URLSearchParams('code=1&state=abc'))).toBeUndefined();
        });
    });
});
