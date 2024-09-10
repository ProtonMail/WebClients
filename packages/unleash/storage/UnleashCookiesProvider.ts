import { addDays, endOfDay } from 'date-fns';

import { deleteCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

import type { FeatureFlagToggle } from '../interface';

export const UNLEASH_FLAG_COOKIE_NAME = 'Features';

/**
 * Invalid characters list
 * ",": Cookies don't support commas
 * " ": Cookies don't support spaces
 * ":": We already use colon to differentiate our flag name and variant
 */
const UNLEASH_FLAG_INVALID_CHARS = [',', ':', ' '];

const isValidString = (value: string) => UNLEASH_FLAG_INVALID_CHARS.every((char) => !value.includes(char));

/**
 * @description Stores whitelisted feature flags in a cookie for the data team.
 * Data is stored in a comma-separated list with the following format: `flagName:variantName`
 *
 * @param data - List of flags fetched by the Unleash client
 * @param whitelistedFlags - List of whitelisted flags defined in the app
 */
const saveWhitelistedFlagInCookies = (data: FeatureFlagToggle[], whitelistedFlags: string[]) => {
    const enabledFlags = [];

    for (const flagName of whitelistedFlags) {
        // Map whitelisted flags to valid cookie entries
        const flagData = data.find((flag) => flag.name === flagName);

        // If variant is enabled, save flag name + variant
        if (
            flagData?.enabled &&
            flagData?.variant?.enabled &&
            isValidString(flagData.name) &&
            isValidString(flagData.variant.name)
        ) {
            enabledFlags.push(`${flagData.name}:${flagData.variant.name}`);
        }
    }

    if (enabledFlags.length > 0) {
        const cookie = {
            domain: window.location.hostname,
            cookieName: UNLEASH_FLAG_COOKIE_NAME,
            cookieValue: enabledFlags.join(','),
            path: '/',
            secure: true,
            expirationDate: endOfDay(addDays(new Date(), 30)).toUTCString(),
        };
        setCookie(cookie);
    } else {
        deleteCookie(UNLEASH_FLAG_COOKIE_NAME);
    }
};

export default saveWhitelistedFlagInCookies;
