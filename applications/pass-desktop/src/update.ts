import assert from 'assert';
import { randomBytes } from 'crypto';
import { type MessageBoxOptions, type Session, app, autoUpdater, dialog } from 'electron';
import logger from 'electron-log/main';
import Store from 'electron-store';
import isURL from 'is-url';
import os from 'os';

import { type FeatureFlagsResponse, PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

import * as config from './app/config';
import { ARCH } from './lib/env';
import { isMac, isProdEnv, isWindows } from './utils/platform';

type StoreUpdateProperties = {
    'update.distribution': number;
};

type RemoteManifestResponse = {
    Releases: {
        Version: string;
        RolloutPercentage: number;
        CategoryName: 'Stable' | 'EarlyAccess';
    }[];
};

export enum SourceType {
    StaticStorage = 1,
}

export type UpdateSource = {
    type: SourceType.StaticStorage;
    baseUrl: string;
};

export type UpdateOptions = {
    /** Electron session */
    readonly session: Session;
    /** Update source configuration */
    readonly updateSource: UpdateSource;
    /** How frequently to check for updates, in seconds. Defaults to 60 minutes (`3600`). */
    readonly updateInterval?: number;
    /** Prompts to apply the update immediately after download. Defaults to `false`. */
    readonly notifyUser?: boolean;
};

const calculateUpdateDistribution = () => randomBytes(4).readUint32LE() / Math.pow(2, 32);

const store = new Store<StoreUpdateProperties>({
    accessPropertiesByDotNotation: false,
    defaults: {
        'update.distribution': calculateUpdateDistribution(),
    },
});

const userAgent = `ProtonPass/${config.APP_VERSION} (${os.platform()}: ${os.arch()})`;
const supportedPlatforms = ['darwin', 'win32'];

const validateInput = (opts: UpdateOptions) => {
    const defaults = {
        updateInterval: 60 * 60,
        notifyUser: false,
    };

    const { updateInterval, notifyUser, updateSource, session } = {
        ...defaults,
        ...opts,
    };

    // allows electron to be mocked in tests
    const electron: typeof Electron.Main = (opts as any).electron || require('electron');

    assert(
        updateSource.baseUrl && isURL(updateSource.baseUrl) && updateSource.baseUrl.startsWith('https:'),
        'baseUrl must be a valid HTTPS URL'
    );

    assert(updateInterval >= 5 * 60, 'updateInterval must be 5 minutes (`300`) or more');

    return { updateSource, updateInterval, electron, notifyUser, session };
};

const checkForUpdates = async (opts: ReturnType<typeof validateInput>) => {
    // don't attempt to update if rollout % not satisfied
    const remoteManifestUrl = `https://proton.me/download/PassDesktop/${process.platform}/${ARCH}/version.json`;
    const remoteManifest = await opts.session
        .fetch(remoteManifestUrl)
        .then((r) => r.json())
        .then((r: RemoteManifestResponse) => r)
        .catch(noop);

    const latestRelease = (() => {
        if (!Array.isArray(remoteManifest?.Releases)) return;
        return remoteManifest.Releases.find((r) => r.CategoryName === 'Stable');
    })();

    if (!latestRelease) {
        logger.log(`[Update] No stable release found, url=${remoteManifestUrl}`);
        return;
    }

    const localDistributionPct = store.get('update.distribution') || 0;
    const remoteDistributionPct = latestRelease.RolloutPercentage || 0;
    if (remoteDistributionPct < localDistributionPct) {
        logger.log(
            `[Update] Rollout distribution short-circuit triggered, r=${remoteDistributionPct}, l=${localDistributionPct}, v=${latestRelease.Version}`
        );
        return;
    }

    // don't attempt to update if PassEnableDesktopAutoUpdate disabled
    const featureFlagsUrl = `${config.API_URL}/feature/v2/frontend`;
    const featureFlags = await opts.session
        .fetch(featureFlagsUrl)
        .then((r) => r.json())
        .then((r: FeatureFlagsResponse) => r.toggles)
        .catch(noop);

    if (!featureFlags?.some((f) => f.name === PassFeature.PassEnableDesktopAutoUpdate)) {
        logger.log('[Update] Feature flag short-circuit triggered');
        return;
    }

    // don't attempt to update during development
    if (!isProdEnv()) {
        logger.log(`[Update] Unpacked app short-circuit triggered`);
        return;
    }

    autoUpdater.checkForUpdates();
};

const initUpdater = (opts: ReturnType<typeof validateInput>) => {
    const { updateSource, updateInterval } = opts;

    // exit early on unsupported platforms, e.g. `linux`
    if (!supportedPlatforms.includes(process?.platform)) {
        logger.log(
            `Electron's autoUpdater does not support the '${process.platform}' platform. Ref: https://www.electronjs.org/docs/latest/api/auto-updater#platform-notices`
        );
        return;
    }

    let feedURL = updateSource.baseUrl;
    let serverType: 'default' | 'json' = 'default';

    if (isMac) {
        feedURL += '/RELEASES.json';
        serverType = 'json';
    }

    autoUpdater.setFeedURL({
        url: feedURL,
        headers: { 'user-agent': userAgent },
        serverType,
    });

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
        store.set('update.distribution', calculateUpdateDistribution());
    });

    autoUpdater.on('update-not-available', () => {
        logger.log('[Update] No updates available.');
    });

    if (opts.notifyUser) {
        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
            logger.log('update-downloaded', [event, releaseNotes, releaseName, releaseDate, updateURL]);

            const dialogOpts: MessageBoxOptions = {
                type: 'info',
                buttons: ['Restart', 'Later'],
                title: 'Update Available',
                message: isWindows ? releaseNotes : releaseName,
                detail: 'A new version of Proton Pass has been downloaded. Restart the application to apply the updates.',
            };

            dialog
                .showMessageBox(dialogOpts)
                .then(({ response }) => {
                    if (response === 0) autoUpdater.quitAndInstall();
                })
                .catch(noop);
        });
    }

    // check for updates right away and keep checking later
    checkForUpdates(opts).catch(noop);
    setInterval(() => checkForUpdates(opts), updateInterval * 1_000);
};

export const updateElectronApp = (opts: UpdateOptions) => {
    // check for bad input early, so it will be logged during development
    const safeOpts = validateInput(opts);

    if (safeOpts.electron.app.isReady()) initUpdater(safeOpts);
    else app.on('ready', () => initUpdater(safeOpts));
};
