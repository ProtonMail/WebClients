import { randomBytes } from 'crypto';
import type { CookiesSetDetails } from 'electron';
import { type Session, app, autoUpdater } from 'electron';

import { type FeatureFlagsResponse, PassFeature } from '@proton/pass/types/api/features';
import { semver } from '@proton/pass/utils/string/semver';
import noop from '@proton/utils/noop';

import config from './app/config';
import { ARCH } from './lib/env';
import { userAgent } from './lib/user-agent';
import { store } from './store';
import logger from './utils/logger';
import { isMac, isProdEnv } from './utils/platform';

const SUPPORTED_PLATFORMS = ['darwin', 'win32'];
export const UPDATE_SOURCE_URL = `https://proton.me/download/PassDesktop/${process.platform}/${ARCH}`;
const UPDATE_INTERVAL = 60 * 60 * 1_000; // 1h

export type StoreUpdateProperties = {
    distribution: number;
};

export type RemoteManifestResponse = {
    Releases: {
        Version: string;
        RolloutPercentage: number;
        CategoryName: 'Stable' | 'Beta';
    }[];
};

const calculateUpdateDistribution = () => randomBytes(4).readUint32LE() / Math.pow(2, 32);

const getIsBeta = () => store.get('optInForBeta') === true;

const getFeedURL = (isBeta: boolean) => {
    let feedURL = UPDATE_SOURCE_URL;
    let serverType: 'default' | 'json' = 'default';

    if (isBeta) {
        feedURL += '/beta';
    }

    if (isMac) {
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
            (getIsBeta() ? ['Stable', 'Beta'] : ['Stable']).includes(v.CategoryName)
        ).sort((a, b) => semver(b.Version) - semver(a.Version))[0];
    })();

    if (!latestRelease) {
        logger.log(`[Update] No stable release found, url=${remoteManifestUrl}`);
        return false;
    }

    // no update if latest version is not newer
    if (semver(latestRelease.Version) <= semver(config.APP_VERSION)) {
        logger.log(
            `[Update] Latest release is not newer, current=${config.APP_VERSION}, latest=${latestRelease.Version}`
        );
        return false;
    }

    // no update if rollout % not satisfied
    const localDistributionPct = store.get('update')?.distribution || calculateUpdateDistribution();
    const remoteDistributionPct = latestRelease.RolloutPercentage || 0;
    if (remoteDistributionPct < localDistributionPct) {
        logger.log(
            `[Update] Rollout distribution short-circuit triggered, r=${remoteDistributionPct}, l=${localDistributionPct}, v=${latestRelease.Version}`
        );
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
        return false;
    }

    // reset feed url each time to adapt if beta settings changed
    const feedUrl = getFeedURL(getIsBeta());
    autoUpdater.setFeedURL(feedUrl);
    logger.log(`[Update] Set feed url ${feedUrl.url}`);

    // don't attempt to update during development
    if (!isProdEnv()) {
        logger.log(`[Update] Unpacked app short-circuit triggered as non prod env`);
        // a bit weird but we eject because of dev env but there is a new version
        // so we won't update but we can continue simulation as it was a yes
        return true;
    }

    logger.log(`[Update] Check for update v=${latestRelease.Version}`);
    autoUpdater.checkForUpdates();
    return true;
};

const initUpdater = (session: Session) => {
    // exit early on unsupported platforms, e.g. `linux`
    if (!SUPPORTED_PLATFORMS.includes(process?.platform)) {
        logger.log(
            `Electron's autoUpdater does not support the '${process.platform}' platform. Ref: https://www.electronjs.org/docs/latest/api/auto-updater#platform-notices`
        );
        return;
    }

    autoUpdater.setFeedURL(getFeedURL(getIsBeta()));

    autoUpdater.on('error', (err) => {
        logger.log('[Update] An error ocurred');
        logger.log(err);
    });

    autoUpdater.on('checking-for-update', () => {
        logger.log('[Update] Checking for updates...');
    });

    autoUpdater.on('update-available', () => {
        logger.log('[Update] Update available; downloading...');
    });

    autoUpdater.on('update-downloaded', () => {
        logger.log('[Update] Update downloaded.');
        store.set('update', { distribution: calculateUpdateDistribution() });
    });

    autoUpdater.on('update-not-available', () => {
        logger.log('[Update] No updates available.');
    });

    autoUpdater.on('update-downloaded', () => {
        logger.log('[Update] No updates available.');
    });

    // check for updates right away and keep checking later
    checkForUpdates(session).catch(noop);
    setInterval(() => checkForUpdates(session), UPDATE_INTERVAL);
};

export const updateElectronApp = (session: Session) => {
    if (app.isReady()) initUpdater(session);
    else app.on('ready', () => initUpdater(session));
};

export const setTagCookie = async (session: Session) => {
    const apiUrl = new URL(config.API_URL);

    const cookie: CookiesSetDetails = {
        url: apiUrl.origin,
        name: 'Tag',
        value: getIsBeta() ? 'beta' : 'default',
        domain: apiUrl.host,
        path: '/',
        secure: true,
        httpOnly: false,
        expirationDate: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 31 * 3, // 3 months
        sameSite: 'no_restriction',
    };

    await session.cookies.set(cookie);
};
