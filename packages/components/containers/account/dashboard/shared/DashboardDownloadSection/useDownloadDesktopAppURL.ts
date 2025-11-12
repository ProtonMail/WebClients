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

const getDownloadUrlForApp = (app: APP_NAMES, platform: DESKTOP_PLATFORMS) => {
    switch (app) {
        case APPS.PROTONDRIVE:
            return getDriveDownloadUrl(platform);
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

export default useDownloadDesktopAppURL;
