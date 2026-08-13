import { addDays, endOfDay } from 'date-fns';

import { deleteCookie, getCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

import type { FeatureFlagToggle } from '../interface';

export const UNLEASH_FLAG_COOKIE_NAME = 'Features';

const ENTRY_SEPARATOR = ',';
const NAME_VARIANT_SEPARATOR = ':';

/**
 * Invalid characters list
 * ",": Cookies don't support commas
 * " ": Cookies don't support spaces
 * ":": We already use colon to differentiate our flag name and variant
 */
const UNLEASH_FLAG_INVALID_CHARS = [',', ':', ' '];

export const isValidFeatureFlagCookieString = (value: string) =>
    UNLEASH_FLAG_INVALID_CHARS.every((char) => !value.includes(char));

const parseFeatureFlagCookieEntries = (rawValue: string | undefined): Map<string, string> => {
    const entries = new Map<string, string>();

    for (const pair of rawValue ? rawValue.split(ENTRY_SEPARATOR) : []) {
        const [name, variant] = pair.split(NAME_VARIANT_SEPARATOR);
        if (name && variant) {
            entries.set(name, variant);
        }
    }

    return entries;
};

const serializeFeatureFlagCookieEntries = (entries: Map<string, string>): string => {
    return [...entries].map(([name, variant]) => `${name}${NAME_VARIANT_SEPARATOR}${variant}`).join(ENTRY_SEPARATOR);
};

/**
 * @description Reads the current entries of the shared `Features` cookie, regardless of which
 * consumer wrote them (Unleash allowlisted flags, or anything else merging into this cookie).
 */
export const readFeatureFlagCookieEntries = (): Map<string, string> => {
    return parseFeatureFlagCookieEntries(getCookie(UNLEASH_FLAG_COOKIE_NAME));
};

/**
 * @description Writes the given entries back to the shared `Features` cookie in full -
 * callers are responsible for merging with `readFeatureFlagCookieEntries()` first if they
 * only want to touch a subset of entries.
 */
export const writeFeatureFlagCookieEntries = (entries: Map<string, string>) => {
    if (entries.size === 0) {
        deleteCookie(UNLEASH_FLAG_COOKIE_NAME);
        return;
    }

    setCookie({
        cookieName: UNLEASH_FLAG_COOKIE_NAME,
        cookieValue: serializeFeatureFlagCookieEntries(entries),
        path: '/',
        secure: true,
        expirationDate: endOfDay(addDays(new Date(), 30)).toUTCString(),
    });
};

/**
 * @description Stores allowlisted feature flags in a cookie for the data team.
 * Only entries whose name is in `allowlistedFlags` are touched; anything else already present
 * in the cookie (e.g. other consumers merging into the same cookie) is left untouched.
 *
 * @param data - List of flags fetched by the Unleash client
 * @param allowlistedFlags - List of allowlisted flags defined in the app
 */
const saveAllowlistedFlagInCookies = (data: FeatureFlagToggle[], allowlistedFlags: string[]) => {
    // There are cases where data is not an array, better prevent it
    if (!Array.isArray(data)) {
        return;
    }

    const entries = readFeatureFlagCookieEntries();

    for (const flagName of allowlistedFlags) {
        entries.delete(flagName);

        // Map allowlisted flags to valid cookie entries
        const flagData = data.find((flag) => flag.name === flagName);

        // If variant is enabled, save flag name + variant
        if (
            flagData?.enabled &&
            flagData?.variant?.enabled &&
            isValidFeatureFlagCookieString(flagData.name) &&
            isValidFeatureFlagCookieString(flagData.variant.name)
        ) {
            entries.set(flagData.name, flagData.variant.name);
        }
    }

    writeFeatureFlagCookieEntries(entries);
};

export default saveAllowlistedFlagInCookies;
