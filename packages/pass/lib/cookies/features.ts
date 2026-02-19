import { getPassCookie, setPassCookie } from '@proton/pass/lib/cookies/cookies';
import type { PassFeature } from '@proton/pass/types/api/features';
import { addDays, endOfDay } from '@proton/shared/lib/date-fns-utc';

export const UNLEASH_FLAG_COOKIE_NAME = 'Features';

/** Returns feature variants indexed by feature name */
export const getFeaturesFromCookie = (): Record<string, string> => {
    try {
        /** Format: "FlagName:Variant,SecondFlagName:Variant" */
        const cookie = getPassCookie(UNLEASH_FLAG_COOKIE_NAME);
        if (!cookie) return {};

        return Object.fromEntries(
            cookie
                .split(',')
                .map((pair) => pair.split(':'))
                .filter(([flag, variant]) => flag && variant)
        );
    } catch {
        return {};
    }
};

/* Copied from packages/unleash/storage/UnleashCookiesProvider.ts */
const UNLEASH_FLAG_INVALID_CHARS = [',', ':', ' '];

const isValidString = (value: string) => UNLEASH_FLAG_INVALID_CHARS.every((char) => !value.includes(char));

/** Update the `Features` cookie with a feature flag variant for the data team, merging with existing flags.
 * Data is stored in a comma-separated list with the following format: `flagName:variantName`.
 * Only for web/desktop, currently no-op for browser extension. */
export const updateFeatureVariantCookie = (flagName: PassFeature, variantName: string) => {
    if (EXTENSION_BUILD || !isValidString(flagName) || !isValidString(variantName)) return;

    const features = getFeaturesFromCookie();
    features[flagName] = variantName;

    const featureArray = Object.entries(features).map(([flag, variant]) => `${flag}:${variant}`);

    const cookie = {
        domain: window.location.hostname,
        cookieName: UNLEASH_FLAG_COOKIE_NAME,
        cookieValue: featureArray.join(','),
        path: '/',
        secure: true,
        expirationDate: endOfDay(addDays(new Date(), 30)).toUTCString(),
    };

    setPassCookie(cookie);
};
