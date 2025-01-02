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

    it('should not expire cookies', () => {
        setCookie({
            cookieName: 'name',
            cookieValue: '125',
            expirationDate: new Date(2034, 0).toUTCString(),
        });
        // Can't actually check expires
        expect(document.cookie).toEqual('name=125');
    });

    it('should expire cookies', () => {
        setCookie({
            cookieName: 'name',
            cookieValue: '125',
            expirationDate: new Date(2020, 0).toUTCString(),
        });
        expect(document.cookie).toEqual('');
    });

    it('should get cookie', () => {
        document.cookie = 'name=124';
        expect(getCookie('name')).toEqual('124');
    });

    it('should get first cookie if there are multiple', () => {
        expect(getCookie('0d938947', 'a=1; 0d938947=1; 0d938947=1; b=1')).toEqual('1');
    });

    it('should return undefined cookie if there is no match', () => {
        expect(getCookie('0d938947', 'a=1; b=1')).toBeUndefined();
    });

    it('should get first cookie if there is one', () => {
        expect(getCookie('0d938947', '0d938947=1')).toEqual('1');
    });
});
