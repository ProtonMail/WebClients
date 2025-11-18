import { stringToUtf8Array, utf8ArrayToString } from '@proton/crypto/lib/utils';
import { getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

export const COOKIE_NAME = 'OrgTheme';

export const syncToCookie = (cookieValue: string | undefined) => {
    // Note: We might set `undefined` which will clear the cookie
    setCookie({
        cookieName: COOKIE_NAME,
        cookieValue,
        cookieDomain: getSecondLevelDomain(window.location.hostname),
        path: '/',
        expirationDate: 'max',
    });
};

export interface OrgThemeCookie {
    LogoID: string;
    Name: string;
    LocalID: number;
}

export const serializeOrgTheme = (organization: OrganizationExtended | undefined, localID: number) => {
    const settings = organization?.Settings;
    if (!settings || !settings.LogoID) {
        return undefined;
    }
    const value: OrgThemeCookie = {
        LogoID: settings.LogoID,
        Name: (organization?.Name || '').slice(0, 50),
        LocalID: localID,
    };
    return stringToUtf8Array(JSON.stringify(value)).toBase64({ alphabet: 'base64url', omitPadding: true });
};

export const deserializeOrgTheme = (serializedValue: string): OrgThemeCookie | undefined => {
    try {
        const deserializedValue = utf8ArrayToString(Uint8Array.fromBase64(serializedValue, { alphabet: 'base64url' }));
        const parsedValue = JSON.parse(deserializedValue);
        const value: OrgThemeCookie = {
            LogoID: String(parsedValue.LogoID),
            Name: String(parsedValue.Name),
            LocalID: Number(parsedValue.LocalID),
        };
        return value;
    } catch (e) {}
};

export const getOrganizationThemeFromCookie = () => {
    const cookie = getCookie(COOKIE_NAME);
    if (!cookie) {
        return undefined;
    }
    return deserializeOrgTheme(cookie);
};
