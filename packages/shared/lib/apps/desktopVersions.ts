import type { DESKTOP_APP_NAMES, DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

export interface Props {
    appName: DESKTOP_APP_NAMES;
    platform: DESKTOP_PLATFORMS;
    version: 'latest' | string;
    category: RELEASE_CATEGORIES;
    manifestVersion?: string;
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

type VersionLoadErrorTypes = 'NETWORK_ERROR' | 'HTTP_ERROR' | 'FORMAT_ERROR';

export class VersionLoadError extends Error {
    constructor(name: VersionLoadErrorTypes, message: string) {
        super(message);
        this.name = name;
    }
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
    manifestVersion,
}: Props): Promise<
    | {
          url: string;
          version: string;
      }
    | undefined
> => {
    try {
        const url = `/${appName}/${platform}${manifestVersion ? '/' + manifestVersion : ''}/version.json`;

        const response = await fetch(getDownloadUrl(url));
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
