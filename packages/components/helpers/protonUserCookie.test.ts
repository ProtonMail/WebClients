import { isProtonUserFromCookie, setIsProtonUserCookie } from './protonUserCookie';

jest.mock('@proton/shared/lib/helpers/cookies', () => ({
    getCookie: jest.fn(),
    setCookie: jest.fn(),
}));

jest.mock('@proton/shared/lib/helpers/url', () => ({
    getSecondLevelDomain: jest.fn(),
}));

const { getSecondLevelDomain } = require('@proton/shared/lib/helpers/url');
const { getCookie, setCookie } = require('@proton/shared/lib/helpers/cookies');

describe('setIsProtonUserCookie', () => {
    const IS_PROTON_USER_COOKIE_NAME = 'is-proton-user';
    const cookieValue = '1';
    const oneYearFromToday = new Date(
        new Date().getFullYear() + 1,
        new Date().getMonth(),
        new Date().getDate()
    ).toUTCString();
    const cookieDomain = `.proton.me`;

    beforeEach(() => {
        jest.clearAllMocks();
        getSecondLevelDomain.mockReturnValue('proton.me');
    });

    it('should set the cookie if it does not exist', () => {
        getCookie.mockReturnValue(null);

        const result = setIsProtonUserCookie();

        expect(getCookie).toHaveBeenCalledWith(IS_PROTON_USER_COOKIE_NAME);
        expect(setCookie).toHaveBeenCalledWith({
            cookieName: IS_PROTON_USER_COOKIE_NAME,
            cookieValue: cookieValue,
            cookieDomain,
            expirationDate: oneYearFromToday,
            path: '/',
        });
        expect(result).toBe(null);
    });

    it('should not set the cookie if it already exists', () => {
        getCookie.mockReturnValue(cookieValue);

        const result = setIsProtonUserCookie();

        expect(getCookie).toHaveBeenCalledWith(IS_PROTON_USER_COOKIE_NAME);
        expect(setCookie).not.toHaveBeenCalled();
        expect(result).toBe(cookieValue);
    });
});

describe('isProtonUserFromCookie', () => {
    const IS_PROTON_USER_COOKIE_NAME = 'is-proton-user';
    const cookieValue = '1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return true if the cookie is set', () => {
        getCookie.mockReturnValue(cookieValue);

        const result = isProtonUserFromCookie();

        expect(getCookie).toHaveBeenCalledWith(IS_PROTON_USER_COOKIE_NAME);
        expect(result).toBe(true);
    });

    it('should return false if the cookie is not set', () => {
        getCookie.mockReturnValue(null);

        const result = isProtonUserFromCookie();

        expect(getCookie).toHaveBeenCalledWith(IS_PROTON_USER_COOKIE_NAME);
        expect(result).toBe(false);
    });
});
