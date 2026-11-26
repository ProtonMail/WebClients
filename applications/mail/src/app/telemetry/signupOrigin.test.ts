import { isFromWebSignup, rememberWebSignup } from './signupOrigin';

describe('web signup origin', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('is not from the web signup by default', () => {
        rememberWebSignup('', '?ref=abc');

        expect(isFromWebSignup()).toBe(false);
    });

    it('remembers the parameter from any of the searches', () => {
        rememberWebSignup('', '?welcome=true&signupProduct=Mail&ref=abc');

        expect(isFromWebSignup()).toBe(true);
    });

    it('ignores signups started from another app or from the generic flow', () => {
        rememberWebSignup('?welcome=true', '?welcome=true&signupProduct=Pass');

        expect(isFromWebSignup()).toBe(false);
    });

    it('keeps it for the rest of the session', () => {
        rememberWebSignup('?welcome=true&signupProduct=Mail');
        rememberWebSignup('', '');

        expect(isFromWebSignup()).toBe(true);
    });
});
