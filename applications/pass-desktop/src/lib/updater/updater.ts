import { type Session, autoUpdater } from 'electron';

import { type FeatureFlagsResponse, PassFeature } from '@proton/pass/types/api/features';
import { UpdateStatus } from '@proton/pass/types/desktop';
import { semver } from '@proton/pass/utils/string/semver';
import noop from '@proton/utils/noop';

import { msix_updater } from '../../../native';
import config from '../../app/config';
import { ARCH } from '../../lib/env';
import { userAgent } from '../../lib/user-agent';
import logger from '../../utils/logger';
import { isMac, isProdEnv, isWindows } from '../../utils/platform';
import { calculateUpdateDistribution } from './helpers';
import { fakeDownload } from './mock';
import { getUpdateStore, initUpdateStore, setUpdateStore } from './store';

const SUPPORTED_PLATFORMS = ['darwin', 'win32'];
export const UPDATE_SOURCE_URL = `https://proton.me/download/PassDesktop/${process.platform}/${ARCH}`;
const UPDATE_INTERVAL = 60 * 60 * 1_000; // 1h

let checkInFlight = false;

export type RemoteManifestResponse = {
    Releases: {
        Version: string;
        RolloutPercentage: number;
        CategoryName: 'Stable' | 'Beta';
        File?: { Url: string }[];
    }[];
};

const getFeedURL = (isBeta: boolean) => {
    let feedURL = UPDATE_SOURCE_URL;
    let serverType: 'default' | 'json' = 'default';

    if (isBeta) {
        feedURL += '/beta';
    }

    if (isMac()) {
        feedURL += '/RELEASES.json';
        serverType = 'json';
    }

    return {
        url: feedURL,
        headers: { 'user-agent': userAgent() },
        serverType,
    };
};

export const checkForUpdates = async (session: Session): Promise<boolean> => {
    if (checkInFlight) {
        logger.log('[Update] Check already in progress, skipping');
        return false;
    }

    checkInFlight = true;

    try {
        setUpdateStore({ status: UpdateStatus.Checking });

        const remoteManifestUrl = `https://proton.me/download/PassDesktop/${process.platform}/${ARCH}/version.json`;
        const remoteManifest = await session
            .fetch(remoteManifestUrl)
            .then((r) => r.json())
            .then((r: RemoteManifestResponse) => r)
            .catch(noop);

        // sort on semver version, filter or not 'Beta', return latest
        const latestRelease = (() => {
            if (!Array.isArray(remoteManifest?.Releases)) return;
            return remoteManifest.Releases.filter((v) =>
                (getUpdateStore().beta ? ['Stable', 'Beta'] : ['Stable']).includes(v.CategoryName)
            ).sort((a, b) => semver(b.Version) - semver(a.Version))[0];
        })();

        if (!latestRelease) {
            logger.log(`[Update] No stable release found, url=${remoteManifestUrl}`);
            setUpdateStore({ status: UpdateStatus.Idle });
            return false;
        }

        // no update if latest version is not newer
        if (semver(latestRelease.Version) <= semver(config.APP_VERSION)) {
            logger.log(
                `[Update] Latest release is not newer, current=${config.APP_VERSION}, latest=${latestRelease.Version}`
            );
            setUpdateStore({ status: UpdateStatus.Idle });
            return false;
        }

        // no update if rollout % not satisfied
        const localDistributionPct = getUpdateStore().distribution;
        const remoteDistributionPct = latestRelease.RolloutPercentage || 0;
        if (remoteDistributionPct < localDistributionPct) {
            logger.log(
                `[Update] Rollout distribution short-circuit triggered, r=${remoteDistributionPct}, l=${localDistributionPct}, v=${latestRelease.Version}`
            );
            setUpdateStore({ status: UpdateStatus.Idle });
            return false;
        }

        // no update if PassEnableDesktopAutoUpdate disabled
        const featureFlagsUrl = `${config.API_URL}/feature/v2/frontend`;
        const featureFlags = await session
            .fetch(featureFlagsUrl)
            .then((r) => r.json())
            .then((r: FeatureFlagsResponse) => r.toggles)
            .catch(noop);

        if (!featureFlags?.some((f) => f.name === PassFeature.PassEnableDesktopAutoUpdate)) {
            logger.log('[Update] Feature flag short-circuit triggered');
            setUpdateStore({ status: UpdateStatus.Idle });
            return false;
        }

        setUpdateStore({ newVersion: latestRelease.Version });

        // don't attempt to update during development — simulate the full download flow
        if (!isProdEnv()) {
            void fakeDownload(latestRelease.Version);
            return true;
        }

        logger.log(`[Update] Check for update v=${latestRelease.Version}`);

        if (isWindows()) {
            const url = latestRelease.File?.[0]?.Url;

            if (!url) {
                logger.log(`[Update] No url found in the latest release`);
                setUpdateStore({ status: UpdateStatus.Idle });
                return false;
            }
            setUpdateStore({ status: UpdateStatus.Downloading, progress: 0 });
            try {
                await msix_updater.installUpdate(url, (err, progress) => {
                    if (err === null) setUpdateStore({ progress });
                });
                setUpdateStore({ status: UpdateStatus.UpdateReady, progress: null });
            } catch (err) {
                logger.log('[Update] Windows install failed', err);
                setUpdateStore({ status: UpdateStatus.Idle, progress: null });
                return false;
            }
        } else if (isMac()) {
            // reset feed url each time to adapt if beta settings changed
            const feedUrl = getFeedURL(getUpdateStore().beta);
            autoUpdater.setFeedURL(feedUrl);
            logger.log(`[Update] Set feed url ${feedUrl.url}`);

            autoUpdater.checkForUpdates();
        }

        return true;
    } finally {
        checkInFlight = false;
    }
};

export const startUpdater = (session: Session) => {
    // exit early on unsupported platforms, e.g. `linux`
    if (!SUPPORTED_PLATFORMS.includes(process?.platform)) {
        logger.log(
            `Electron's autoUpdater does not support the '${process.platform}' platform. Ref: https://www.electronjs.org/docs/latest/api/auto-updater#platform-notices`
        );
        return;
    }

    // ensure distribution is stable for the lifetime of the installation
    initUpdateStore();

    autoUpdater.on('error', (err) => {
        logger.log('[Update] An error occurred', err);
    });

    autoUpdater.on('checking-for-update', () => {
        logger.log('[Update] Checking for updates...');
    });

    autoUpdater.on('update-available', () => {
        logger.log('[Update] Update available; downloading...');
        setUpdateStore({ status: UpdateStatus.Downloading });
    });

    autoUpdater.on('update-downloaded', () => {
        logger.log('[Update] Update downloaded.');
        setUpdateStore({ status: UpdateStatus.UpdateReady, distribution: calculateUpdateDistribution() });
    });

    autoUpdater.on('update-not-available', () => {
        logger.log('[Update] No updates available.');
        setUpdateStore({ status: UpdateStatus.Idle });
    });

    // check for updates right away and keep checking later
    checkForUpdates(session).catch(noop);
    setInterval(() => checkForUpdates(session), UPDATE_INTERVAL);
};
