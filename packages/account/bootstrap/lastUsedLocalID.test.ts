// @vitest-environment happy-dom
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import { getFallbackLocalID, removeLastUsedLocalID, setLastUsedLocalID } from './lastUsedLocalID';

/** jsdom won't accept a cookie for the second level domain, so the cookie is held here instead. */
const cookie: { value?: string } = {};

vi.mock('@proton/shared/lib/helpers/cookies', () => ({
    setCookie: ({ cookieValue }: { cookieValue: string }) => {
        cookie.value = cookieValue;
    },
    getCookie: () => cookie.value,
}));

const setAccountLocalIDs = (localIDs: number[]) => {
    cookie.value = utf8StringToUint8Array(JSON.stringify(localIDs)).toBase64({
        alphabet: 'base64url',
        omitPadding: true,
    });
};

beforeEach(() => {
    delete cookie.value;
    removeLastUsedLocalID();
});

describe('getFallbackLocalID', () => {
    it('falls back to the last used local id when account does not list the requested one', () => {
        setAccountLocalIDs([0, 1]);
        setLastUsedLocalID(1);

        expect(getFallbackLocalID(2)).toBe(1);
    });

    it('does not fall back when account lists the requested local id, since it can fork it', () => {
        setAccountLocalIDs([1, 2]);
        setLastUsedLocalID(1);

        expect(getFallbackLocalID(2)).toBeUndefined();
    });

    it('does not fall back to a last used local id that account does not list', () => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(1);

        expect(getFallbackLocalID(2)).toBeUndefined();
    });

    it('does not fall back to the requested local id itself', () => {
        setAccountLocalIDs([0]);
        setLastUsedLocalID(2);

        expect(getFallbackLocalID(2)).toBeUndefined();
    });

    it('does not fall back without a last used local id', () => {
        setAccountLocalIDs([0]);

        expect(getFallbackLocalID(2)).toBeUndefined();
    });

    it('does not fall back without the cookie, since it is not known which sessions account has', () => {
        setLastUsedLocalID(1);

        expect(getFallbackLocalID(2)).toBeUndefined();
    });
});
