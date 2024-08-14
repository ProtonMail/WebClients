import { addDays } from 'date-fns';

import { deleteCookie, setCookie } from '@proton/shared/lib/helpers/cookies';

import type { FeatureFlag } from '../UnleashFeatureFlags';
import type { FeatureFlagToggle } from '../interface';

const WHITELISTED_COOKIES_FLAGS: FeatureFlag[] = [];

const getFlagData = (data?: FeatureFlagToggle) => {
    if (!data) {
        return undefined;
    }

    const { name } = data;
    const variant = data.variant;
    const variantValue = variant.payload?.value;

    return {
        name,
        enabledVariant: !!(variant.enabled && variantValue),
        hasVariant: !!variantValue,
        variantValue,
    };
};

/**
 * Some flags needs to be stored in cookies to be available for the data team
 * This function will save the whitelisted flags in the cookie.
 * The data is stored in a comma separated list, and is as follow:
 *    - featureName:[variantName], if the flag has a variant
 *    - featureName, if the flag doesn't have a variant
 * @param data - Unleash flags data
 */
const saveWhitelistedFlagInCookies = (data: FeatureFlagToggle[]) => {
    const flagCookieName = 'unleashFlags';

    let cookieValue = [];
    for (const flag of WHITELISTED_COOKIES_FLAGS) {
        const value = data.find((item: FeatureFlagToggle) => item.name === flag);
        const flagData = getFlagData(value);

        if (flagData && flagData.enabledVariant) {
            cookieValue.push(`${flagData.name}:[${flagData.variantValue}]`);
        } else if (flagData && !flagData.hasVariant) {
            cookieValue?.push(flagData.name);
        }
    }

    if (cookieValue?.length) {
        setCookie({
            cookieName: flagCookieName,
            cookieValue: cookieValue.join(','),
            path: '/',
            secure: true,
            expirationDate: addDays(new Date(), 30).toUTCString(),
        });
    } else {
        deleteCookie(flagCookieName);
    }
};

export default saveWhitelistedFlagInCookies;
