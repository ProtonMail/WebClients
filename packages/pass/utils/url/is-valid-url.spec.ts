import { UNSUPPORTED_SCHEMES, isValidURL } from './is-valid-url';

const VALID_SCHEMES = ['http:', 'https:', 'ftp:', 'ssh:', 'telnet:', 'irc:', 'magnet:'];

describe('URL validation', () => {
    test('should try to append `https://` when scheme is missing', () => {
        const { valid, url } = isValidURL('google.com');
        expect(valid).toBe(true);
        expect(url).toEqual('https://google.com/');
    });

    test('should auto-fix scheme through URL constructor', () => {
        const { valid, url } = isValidURL('https:/proton.me');
        expect(valid).toBe(true);
        expect(url).toEqual('https://proton.me/');
    });

    test('should invalidate unsupported schemes', () => {
        UNSUPPORTED_SCHEMES.forEach((scheme) => {
            expect(isValidURL(`${scheme}someurl`).valid).toBe(false);
            expect(isValidURL(`${scheme}/someurl`).valid).toBe(false);
            expect(isValidURL(`${scheme}//someurl`).valid).toBe(false);
            expect(isValidURL('someurl', scheme).valid).toBe(false);
            expect(isValidURL('someurl', `${scheme}/`).valid).toBe(false);
            expect(isValidURL('someurl', `${scheme}//`).valid).toBe(false);
        });
    });

    test('should accept any valid scheme', () => {
        VALID_SCHEMES.forEach((scheme) => {
            expect(isValidURL(`${scheme}someurl`).valid).toBe(true);
            expect(isValidURL(`${scheme}//someurl`).valid).toBe(true);
            expect(isValidURL('someurl', scheme).valid).toBe(true);
            expect(isValidURL('someurl', `${scheme}//`).valid).toBe(true);
        });
    });

    test('should keep `www` in URL if present', () => {
        expect(isValidURL('www.proton.me').url).toEqual('https://www.proton.me/');
        expect(isValidURL('https://www.proton.me').url).toEqual('https://www.proton.me/');
        expect(isValidURL('https://www.proton.me/').url).toEqual('https://www.proton.me/');
        expect(isValidURL('www.proton.me/login').url).toEqual('https://www.proton.me/login');
    });

    test('should preserve query strings and full path', () => {
        expect(isValidURL('proton.me/login/?foo=bar').url).toEqual('https://proton.me/login/?foo=bar');
        expect(isValidURL('proton.me/login/?foo=bar', 'wss:').url).toEqual('wss://proton.me/login/?foo=bar');
        expect(isValidURL('https://proton.me/login/?foo=bar').url).toEqual('https://proton.me/login/?foo=bar');
    });

    test('should invalidate URLs containing internal white-spaces', () => {
        expect(isValidURL('https://www.proton    .me').valid).toBe(false);
        expect(isValidURL('proton.me  /').valid).toBe(false);
        expect(isValidURL('www.proton.me/foo/   ?bar=10').valid).toBe(false);

        expect(isValidURL('proton.me  ').valid).toBe(true);
        expect(isValidURL('www.proton.me/foo/   ').valid).toBe(true);
    });
});
