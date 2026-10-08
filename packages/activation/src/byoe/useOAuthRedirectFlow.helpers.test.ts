import {
    readOAuthCallback,
    readOAuthRedirectState,
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
});
