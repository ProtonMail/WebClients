import { type IconName } from '@proton/components/components/icon/Icon';
import { fetchDesktopVersion } from '@proton/shared/lib/apps/desktopVersions';
import { DESKTOP_APP_NAMES, DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { isMac, isWindows } from '@proton/shared/lib/helpers/browser';

export type PlatformInfo = {
    platform: DESKTOP_PLATFORMS;
    icon: IconName;
    name: string;
    isPreferred: () => boolean;
    hideIfUnavailable?: boolean;

    // These are useful in case we ever want to lock downloads to
    // a specific version or category in the future
    version?: string;
    releaseCategory?: RELEASE_CATEGORIES;
};

/**
 * A sorted list of app platforms, in order of preference.
 *
 * For example, when browsing on macOS, the corresponding platform will be first in the list.
 * If there is no preferred platform, the default order is used.
 */
export const appPlatforms = (
    [
        {
            platform: DESKTOP_PLATFORMS.WINDOWS,
            icon: 'brand-windows',
            name: 'Windows',
            isPreferred: isWindows,
        },
        {
            platform: DESKTOP_PLATFORMS.MACOS,
            icon: 'brand-apple',
            name: 'macOS',
            isPreferred: isMac,
            hideIfUnavailable: true,
        },
    ] satisfies PlatformInfo[] as PlatformInfo[]
).sort((a, b) => Number(b.isPreferred()) - Number(a.isPreferred()));

/**
 * Fetches download URLs for supported platforms and returns them in a map.
 */
export const fetchDesktopDownloads = async () => {
    let versions: Partial<Record<DESKTOP_PLATFORMS, string>> = {};

    await Promise.all(
        appPlatforms.map(({ platform, version, releaseCategory }) =>
            fetchDesktopVersion({
                appName: DESKTOP_APP_NAMES.DRIVE,
                platform,
                version: version || 'latest',
                category: releaseCategory || RELEASE_CATEGORIES.STABLE,
            })
                .then((meta) => {
                    if (!meta) {
                        throw new Error('Undefined response from API');
                    }

                    versions = { ...versions, [platform]: meta.url };
                })
                .catch((reason) => console.warn(`Download link for ${platform} cannot be fetched`, reason))
        )
    );

    return versions;
};
