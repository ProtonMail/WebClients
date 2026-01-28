import { useEffect, useState } from 'react';

import { APPS, type APP_NAMES, DESKTOP_PLATFORMS, RELEASE_CATEGORIES } from '@proton/shared/lib/constants';
import { getDownloadUrl } from '@proton/shared/lib/helpers/url';

const getDriveDownloadUrl = (platform: DESKTOP_PLATFORMS) => {
    if (platform === DESKTOP_PLATFORMS.MACOS) {
        return `/drive/${platform}/version.json`;
    } else {
        return `/drive/${platform}/v1/version.json`;
    }
};

const getMeetDownloadUrl = () => {
    return `/meet/linux/version.json`;
};

const getDownloadUrlForApp = (app: APP_NAMES, platform: DESKTOP_PLATFORMS) => {
    switch (app) {
        case APPS.PROTONDRIVE:
            return getDriveDownloadUrl(platform);
        case APPS.PROTONMEET:
            return getMeetDownloadUrl();
        default:
            return;
    }
};

interface ReleaseFile {
    Url: string;
}
interface Release {
    CategoryName: RELEASE_CATEGORIES;
    ReleaseDate: string;
    File: ReleaseFile;
}
interface Version {
    Releases: Release[];
}

const fetchDownloadUrl = async (relativePath: string) => {
    try {
        const response = await fetch(getDownloadUrl(relativePath));
        const json = (await response.json()) as Version;

        const stableReleases = json.Releases.filter(({ CategoryName }) => CategoryName === RELEASE_CATEGORIES.STABLE);

        // The Releases are pre-sorted in the response. if we spot any mismatch, we can add a sorting logic here
        return stableReleases[0].File.Url;
    } catch (e) {
        // Fallback URL if we can't get the latest version.
        return 'https://protonapps.com';
    }
};

// Linux-specific interfaces and function for handling File array structure
export enum LINUX_DISTRIBUTION {
    UBUNTU = 'ubuntu',
    FEDORA = 'fedora',
}

interface LinuxReleaseFile {
    Identifier?: string;
    Url: string;
    Sha512CheckSum?: string;
}

interface LinuxRelease {
    CategoryName: RELEASE_CATEGORIES;
    Version?: string;
    ReleaseDate: string;
    File: LinuxReleaseFile[];
}

interface LinuxVersion {
    Releases: LinuxRelease[];
}

const fetchLinuxDownloadUrl = async (relativePath: string, distribution: LINUX_DISTRIBUTION) => {
    try {
        const response = await fetch(getDownloadUrl(relativePath));
        const json = (await response.json()) as LinuxVersion;

        const stableReleases = json.Releases.filter(({ CategoryName }) => CategoryName === RELEASE_CATEGORIES.STABLE);

        const latestRelease = stableReleases[0];
        if (!latestRelease) {
            return 'https://protonapps.com';
        }

        // Select the correct file based on distribution
        if (distribution === LINUX_DISTRIBUTION.FEDORA) {
            // Find .rpm file
            const rpmFile = latestRelease.File.find((f) => f.Identifier?.includes('.rpm'));
            if (rpmFile) {
                return rpmFile.Url;
            }
        } else {
            // Default to .deb for Ubuntu/Debian
            const debFile = latestRelease.File.find((f) => f.Identifier?.includes('.deb'));
            if (debFile) {
                return debFile.Url;
            }
        }
        // Fallback to first file if no match
        return latestRelease.File[0]?.Url || 'https://protonapps.com';
    } catch (e) {
        // Fallback URL if we can't get the latest version.
        return 'https://protonapps.com';
    }
};

const useDownloadDesktopAppURL = (app: APP_NAMES, platform: DESKTOP_PLATFORMS) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        const relativePath = getDownloadUrlForApp(app, platform);
        if (relativePath) {
            fetchDownloadUrl(relativePath)
                .then((url: string) => setUrl(url))
                .catch(() => {});
        }
    }, [app, platform]);

    return url;
};

export const useDownloadLinuxDesktopAppURL = (app: APP_NAMES, distribution: LINUX_DISTRIBUTION) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        const relativePath = getDownloadUrlForApp(app, DESKTOP_PLATFORMS.LINUX);
        if (relativePath) {
            fetchLinuxDownloadUrl(relativePath, distribution)
                .then((url: string) => setUrl(url))
                .catch(() => {});
        }
    }, [app, distribution]);

    return url;
};

export default useDownloadDesktopAppURL;
