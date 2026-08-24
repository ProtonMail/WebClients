import { semver } from '@proton/pass/utils/string/semver';

import { RELEASE_CATEGORIES } from '../constants';
import type { DesktopVersion } from './DesktopVersion';

export const getLatestRelease = (
    currentEnvironment: string | undefined,
    releaseList: DesktopVersion[]
): DesktopVersion | undefined => {
    let latestRelease = undefined;
    let latestReleaseSemver = 0;

    for (const release of releaseList) {
        const releaseSemver = semver(release.Version);

        if (release.CategoryName === RELEASE_CATEGORIES.ALPHA && currentEnvironment !== 'alpha') {
            continue;
        }

        if (
            release.CategoryName === RELEASE_CATEGORIES.EARLY_ACCESS &&
            currentEnvironment !== 'alpha' &&
            currentEnvironment !== 'beta'
        ) {
            continue;
        }

        if (releaseSemver > latestReleaseSemver) {
            latestRelease = release;
            latestReleaseSemver = releaseSemver;
        }
    }

    return latestRelease;
};
