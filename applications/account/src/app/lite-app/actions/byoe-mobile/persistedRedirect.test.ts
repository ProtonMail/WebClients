import { resolveNativeRedirect } from './persistedRedirect';

describe('resolveNativeRedirect', () => {
    beforeEach(() => sessionStorage.clear());

    it('uses the URL redirect and keeps it for later loads', () => {
        expect(resolveNativeRedirect('protonmail://connect-gmail/complete', undefined)).toBe(
            'protonmail://connect-gmail/complete'
        );
        expect(resolveNativeRedirect(undefined, undefined)).toBe('protonmail://connect-gmail/complete');
    });

    it('falls back to the OAuth state', () => {
        expect(resolveNativeRedirect(undefined, 'protonmail://connect-gmail/complete')).toBe(
            'protonmail://connect-gmail/complete'
        );
    });

    it('ignores values that are not a Proton app URL', () => {
        sessionStorage.setItem('proton:byoe-mobile-redirect', 'https://evil.example');
        expect(resolveNativeRedirect('https://evil.example', 'javascript:alert(1)')).toBeUndefined();
    });
});
