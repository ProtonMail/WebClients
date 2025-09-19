import { relaunch } from '@tauri-apps/plugin-process';
import { type Update, check } from '@tauri-apps/plugin-updater';
import logger from 'proton-authenticator/lib/logger';

import type { Maybe } from '@proton/pass/types/utils';
import noop from '@proton/utils/noop';

import runtime from './runtime';

type Release = {
    CategoryName: 'EarlyAccess' | 'Stable';
    Version: string;
    RolloutPercentage?: number;
};

type Releases = { Releases: Release[] };

const calculateUpdateDistribution = () => Math.random();

const metadataUrl = (platform: 'windows' | 'linux') =>
    `https://proton.me/download/authenticator/${platform}/version.json`;

export const getLocalUpdateDistribution = () => {
    const STORAGE_KEY = 'updateDistribution';
    const stored = parseFloat(localStorage.getItem(STORAGE_KEY) ?? '');

    if (!stored || isNaN(stored)) {
        const newDistribution = calculateUpdateDistribution();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newDistribution));
        return newDistribution;
    }

    return stored;
};

export async function checkForUpdates(): Promise<Maybe<Update>> {
    logger.info('[Tauri::update] Checking for updates...');

    if (!runtime.platform) {
        logger.info(`[Tauri::update] Unsupported update platform`);
        return;
    }

    try {
        const update = await check();

        if (!update) {
            logger.info('[Tauri::update] No updates found for current version');
            return;
        }

        const extendedMetadata = await fetch(metadataUrl(runtime.platform))
            .then((response) => response.json())
            .then(({ Releases }: Releases) =>
                Releases.find((r) => r.CategoryName === 'Stable' && r.Version === update.version)
            )
            .catch(noop);

        if (!extendedMetadata) {
            logger.info(`[Tauri::update] Missing version.json metadata for version ${update.version}`);
            return;
        }

        const localUpdateDistribution = getLocalUpdateDistribution();
        const remoteUpdateDistribution = extendedMetadata.RolloutPercentage ?? 1;
        if (remoteUpdateDistribution < localUpdateDistribution) {
            logger.info(
                `[Tauri::update] Skipping update, ${remoteUpdateDistribution} (remote) < ${localUpdateDistribution} (local) for version ${update.version}`
            );
            return;
        }

        return update;
    } catch (err) {
        logger.info(`[Tauri::update] Failed to check for updates (${err})`);
    }
}

export async function updateTo(updatePackage: Update) {
    logger.info(`[Tauri::update] Updating to ${updatePackage.version}...`);

    try {
        let downloaded = 0;
        let contentLength = 0;
        await updatePackage.downloadAndInstall((event) => {
            switch (event.event) {
                case 'Started':
                    contentLength = event.data.contentLength ?? 0;
                    logger.info(`[Tauri::update] Started downloading ${event.data.contentLength} bytes`);
                    break;
                case 'Progress':
                    downloaded += event.data.chunkLength;
                    logger.info(`[Tauri::update] Downloaded ${downloaded}/${contentLength}`);
                    break;
                case 'Finished':
                    logger.info('[Tauri::update] Download finished');
                    break;
            }
        });

        logger.info(`[Tauri::update] Version ${updatePackage.version} installed`);

        await relaunch();
    } catch (err) {
        logger.error(`[Tauri::update] Error updating to ${updatePackage.version} (${err})`);
        throw err;
    }
}
