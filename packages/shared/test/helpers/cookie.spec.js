import { getCookie, setCookie } from '../../lib/helpers/cookies';

describe('cookie helper', () => {
    afterEach(() => {
        document.cookie.split(';').forEach((c) => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
    });

    it('should set cookie', () => {
        setCookie({
            cookieName: 'name',
            cookieValue: '123',
        });
        expect(document.cookie).toEqual('name=123');
    });

    it('should clear cookies', () => {
        setCookie({
            cookieName: 'name',
            cookieValue: '121',
        });
        expect(document.cookie).toEqual('name=121');
        setCookie({
            cookieName: 'name',
            cookieValue: undefined,
        });
        expect(document.cookie).toEqual('');
    });

    it('should expire cookies', () => {
        setCookie({
            cookieName: 'name',
            cookieValue: '125',
            expirationDate: new Date(2025, 0).toUTCString(),
        });
        // Can't actually check expires
        expect(document.cookie).toEqual('name=125');
    });

    it('should get cookie', () => {
        document.cookie = 'name=124';
        expect(getCookie('name')).toEqual('124');
    });
});
