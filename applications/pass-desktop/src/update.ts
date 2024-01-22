import assert from 'assert';
import { type MessageBoxOptions, type Session, app, autoUpdater, dialog } from 'electron';
import logger from 'electron-log/main';
import isURL from 'is-url';
import os from 'os';

import { type FeatureFlagsResponse, PassFeature } from '@proton/pass/types/api/features';
import noop from '@proton/utils/noop';

import * as config from './app/config';

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

const pkg = require('../package.json');
const userAgent = `${pkg.name}/${pkg.version} (${os.platform()}: ${os.arch()})`;
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
    // don't attempt to update during development
    // if (!app.isPackaged) {
    //     logger.log(`[Update] Aborting, app in development mode`);
    //     return;
    // }

    // don't attempt to update if PassEnableDesktopAutoUpdate
    const featureFlags = await opts.session
        .fetch(`${config.API_URL}/feature/v2/frontend`)
        .then((r) => r.json())
        .then((r: FeatureFlagsResponse) => r.toggles)
        .catch(noop);

    if (featureFlags?.some((f) => f.name === PassFeature.PassEnableDesktopAutoUpdate)) autoUpdater.checkForUpdates();
    else logger.log('[Update] FF short-circuit triggered');
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

    if (process.platform === 'darwin') {
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
                message: process.platform === 'win32' ? releaseNotes : releaseName,
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
