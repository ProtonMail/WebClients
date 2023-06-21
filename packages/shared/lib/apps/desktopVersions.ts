import { DESKTOP_APP_NAMES, DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

export interface Props {
    appName: DESKTOP_APP_NAMES;
    platform: DESKTOP_PLATFORMS;
    version: 'latest' | string;
    category: RELEASE_CATEGORIES;
}

interface RELEASE {
    CategoryName: RELEASE_CATEGORIES;
    Version: string;
    ReleaseDate: string;
    File: {
        Url: string;
        Sha512CheckSum: 'string';
        Args: string;
    };
    ReleaseNotes: {
        Type: string;
        Notes: string[];
    }[];
}

/*
 * This helper will help to fetch specific or latest version of a desktop app
 * It currently only support Drive apps.
 */
export const fetchDesktopVersion = async ({
    appName,
    platform,
    category,
    version,
}: Props): Promise<
    | {
          url: string;
          version: string;
      }
    | undefined
> => {
    try {
        const response = await fetch(getDownloadUrl(`/${appName}/${platform}/version.json`));
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const { Releases: releases }: { Releases: RELEASE[] } = await response.json();

        const filteredReleases = releases.filter((release) => release.CategoryName === category);
        if (!filteredReleases.length) {
            return undefined;
        }
        if (version === 'latest') {
            // We assume that latest release is always the first one
            const latestRelease = filteredReleases[0];
            return { url: latestRelease.File.Url, version: latestRelease.Version };
        } else {
            const release = filteredReleases.find((release) => release.Version === version);
            if (!release) {
                return undefined;
            }
            return { url: release.File.Url, version: release.Version };
        }
    } catch (e: any) {
        throw Error(`Failed to fetch ${appName} ${platform}@${version} app's url`, {
            cause: e,
        });
    }
};
