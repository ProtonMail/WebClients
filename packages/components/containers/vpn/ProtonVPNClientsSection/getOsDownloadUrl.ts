import { isAndroid, isIos } from '@proton/shared/lib/helpers/browser';

import { androidMarketplaceUrl, defaultDownloadUrl, iosMarketplaceUrl } from './downloadLinks';

/**
 * Redirects phone users to their marketplace. The other users
 * are redirected to https://protonvpn.com/download
 */
export const getOsDownloadUrl = () => {
    if (isIos()) {
        return iosMarketplaceUrl;
    }

    if (isAndroid()) {
        return androidMarketplaceUrl;
    }

    return defaultDownloadUrl;
};
