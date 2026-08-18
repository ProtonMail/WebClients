import { isAndroid, isArm, isIos, isMac, isWindows } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { androidMarketplaceUrl, defaultDownloadUrl, iosMarketplaceUrl } from '../../constants/downloadLinks';
import { useFetchDownloadLinks } from '../hooks/useFetchDownloadLinks';

/**
 * Redirects phone users to their marketplace.
 * Returns the latest version of Mac and Windows versions.
 * The other users are redirected to https://protonvpn.com/download
 */
export const useOsDownloadUrl = () => {
    const flag = useFlag('DesktopDownloadApiEnabled');
    const { windows, mac } = useFetchDownloadLinks(flag);

    if (isIos()) {
        return iosMarketplaceUrl;
    }

    if (isAndroid()) {
        return androidMarketplaceUrl;
    }

    if (isMac() && mac?.length) {
        return mac[0].link;
    }

    if (isWindows() && windows?.length) {
        if (isArm()) {
            return windows.find((w) => w.title().toLowerCase().includes('arm64'))?.link || defaultDownloadUrl;
        }
        return windows.find((w) => w.title().includes('x64'))?.link || defaultDownloadUrl;
    }

    return defaultDownloadUrl;
};
