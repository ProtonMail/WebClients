import { addDays, endOfDay } from 'date-fns';

import { deleteCookie, setCookie } from '@proton/shared/lib/helpers/cookies';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

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

/**
 * Each writer of the `Features` cookie owns one part, stored in localStorage and replaced in full on
 * every save. The cookie is rebuilt from all parts on each save, so names a writer stops writing disappear.
 */
const FEATURES_COOKIE_PARTS = ['unleash', 'static-experiments'] as const;

type FeaturesCookiePart = (typeof FEATURES_COOKIE_PARTS)[number];

export const isValidFeatureFlagCookieString = (value: string) =>
    UNLEASH_FLAG_INVALID_CHARS.every((char) => !value.includes(char));

const parseFeatureFlagCookieEntries = (rawValue: string | null | undefined): Map<string, string> => {
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

const getPartStorageKey = (part: FeaturesCookiePart) => `features-cookie:${part}`;

const readFeaturesCookiePart = (part: FeaturesCookiePart): Map<string, string> | undefined => {
    const stored = getItem(getPartStorageKey(part));
    return typeof stored === 'string' ? parseFeatureFlagCookieEntries(stored) : undefined;
};

const writeFeaturesCookie = (entries: Map<string, string>) => {
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

const saveFeaturesCookiePart = (part: FeaturesCookiePart, entries: Map<string, string>) => {
    setItem(getPartStorageKey(part), serializeFeatureFlagCookieEntries(entries));

    const cookieEntries = new Map<string, string>();
    for (const otherPart of FEATURES_COOKIE_PARTS) {
        const partEntries = otherPart === part ? entries : readFeaturesCookiePart(otherPart);
        partEntries?.forEach((variant, name) => cookieEntries.set(name, variant));
    }

    writeFeaturesCookie(cookieEntries);
};

export const readStaticExperimentVariants = (): Map<string, string> => {
    return readFeaturesCookiePart('static-experiments') ?? new Map();
};

export const saveStaticExperimentVariants = (variants: Map<string, string>) => {
    saveFeaturesCookiePart('static-experiments', variants);
};

/**
 * @description Stores allowlisted feature flags in a cookie for the data team.
 *
 * @param data - List of flags fetched by the Unleash client
 * @param allowlistedFlags - List of allowlisted flags defined in the app
 */
const saveAllowlistedFlagInCookies = (data: FeatureFlagToggle[], allowlistedFlags: string[]) => {
    // There are cases where data is not an array, better prevent it
    if (!Array.isArray(data)) {
        return;
    }

    const entries = new Map<string, string>();

    for (const flagName of allowlistedFlags) {
        const flagData = data.find((flag) => flag.name === flagName);

        if (
            flagData?.enabled &&
            flagData?.variant?.enabled &&
            isValidFeatureFlagCookieString(flagData.name) &&
            isValidFeatureFlagCookieString(flagData.variant.name)
        ) {
            entries.set(flagData.name, flagData.variant.name);
        }
    }

    saveFeaturesCookiePart('unleash', entries);
};

export default saveAllowlistedFlagInCookies;
