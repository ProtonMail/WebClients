import { autoUpdater, session, app } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import pkg from "../package.json";
import { getPlatform } from "./utils/helpers";
import { getSettings } from "./store/settingsStore";
import { verifyDownloadCertificate } from "./utils/keyPinning";
import { updateLogger } from "./utils/log";
import { RELEASE_CATEGORIES } from "./utils/external/packages/shared/lib/apps/desktopVersions";
import { DESKTOP_PLATFORMS } from "./utils/external/packages/shared/lib/constants";
import {
    DesktopVersion,
    VersionFile,
    VersionFileSchema,
} from "./utils/external/packages/components/containers/desktop/useInboxDesktopVersion";
import { semver } from "./utils/external/packages/pass/utils/string/semver";

export type LocalDesktopVersion = {
    Version: DesktopVersion["Version"];
    RolloutProportion: DesktopVersion["RolloutProportion"];
    CategoryName: DesktopVersion["CategoryName"];
};

export let updateDownloaded = false;
export let cachedLatestVersion: DesktopVersion | null = null;

autoUpdater.on("update-downloaded", () => {
    updateDownloaded = true;
});

autoUpdater.on("before-quit-for-update", () => {
    updateDownloaded = true;
});

/**
 * Checks the available version immediately and repeat check every
 * `updateInverval`. If there is a valid (channel, rollout) version to update
 * it will trigger the update.
 */
export function initializeUpdateChecks() {
    updateLogger.info("Initialization of update checks.");

    const ses = session.fromPartition("persist:update", { cache: false });
    ses.setCertificateVerifyProc(verifyDownloadCertificate);

    checkForValidUpdates();
    setInterval(checkForValidUpdates, pkg.config.updateInterval);
}

const validUpdate = {} as DesktopVersion;

async function checkForValidUpdates() {
    updateLogger.info("Checking for new valid version.");

    const platform = getPlatform();
    const settings = getSettings();
    const local: LocalDesktopVersion = {
        Version: app.getVersion(),
        RolloutProportion: settings.rolloutProportion ?? 1,
        CategoryName: settings.releaseCategory ?? RELEASE_CATEGORIES.STABLE,
    };

    if (validUpdate.Version) {
        updateLogger.info("Electron update already initialized, valid update available:", validUpdate, "local:", local);
        return;
    }

    const availableVersions = await getAvailableVersions(platform);
    if (!availableVersions) {
        return;
    }

    const newUpdate = getNewUpdate(local, availableVersions);
    cachedLatestVersion = newUpdate ?? null;

    if (!newUpdate) {
        return;
    }
    updateLogger.info("New valid update found! new:", newUpdate, "local:", local);

    validUpdate.Version = newUpdate.Version;
    validUpdate.CategoryName = newUpdate.CategoryName;
    validUpdate.RolloutProportion = newUpdate.RolloutProportion;

    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.StaticStorage,
            baseUrl: `https://proton.me/download/mail/${platform}/${newUpdate.Version}/`,
        },
        updateInterval: "5 min", // minimal
        logger: updateLogger,
    });
}

function getNewUpdate(local: LocalDesktopVersion, unorderedAvailableVersions: VersionFile): DesktopVersion | undefined {
    const availableVersions = {
        Releases: unorderedAvailableVersions.Releases.sort((a: DesktopVersion, b: DesktopVersion) =>
            Math.sign(semver(b.Version) - semver(a.Version)),
        ),
    };

    return ((): DesktopVersion | undefined =>
        availableVersions.Releases.find((r: DesktopVersion) => {
            if (local.CategoryName === RELEASE_CATEGORIES.STABLE && r.CategoryName !== RELEASE_CATEGORIES.STABLE) {
                return false;
            }

            if (
                local.CategoryName === RELEASE_CATEGORIES.EARLY_ACCESS &&
                r.CategoryName !== RELEASE_CATEGORIES.STABLE &&
                r.CategoryName !== RELEASE_CATEGORIES.EARLY_ACCESS
            ) {
                return false;
            }

            if (
                local.CategoryName === RELEASE_CATEGORIES.ALPHA &&
                r.CategoryName !== RELEASE_CATEGORIES.STABLE &&
                r.CategoryName !== RELEASE_CATEGORIES.EARLY_ACCESS &&
                r.CategoryName !== RELEASE_CATEGORIES.ALPHA
            ) {
                return false;
            }

            if (!isANewerThanB(r.Version, local.Version)) {
                updateLogger.info("Skipping update: no newer version avaiable, local:", local, "latest:", r);
                return false;
            }

            if (local.RolloutProportion > r.RolloutProportion) {
                updateLogger.info(
                    "Skipping update: a newer version is available",
                    r,
                    `but rollout is low, local:${local.RolloutProportion * 100}%`,
                );
                return false;
            }

            return true;
        }))();
}

function getVersionURL(platform: DESKTOP_PLATFORMS) {
    return `https://proton.me/download/mail/${platform}/version.json`;
}

function isANewerThanB(a: string, b: string) {
    return semver(a) > semver(b);
}

async function getAvailableVersions(platform: DESKTOP_PLATFORMS): Promise<VersionFile | undefined> {
    const updateSession = session.fromPartition("persist:update", { cache: false });

    try {
        const response = await updateSession.fetch(getVersionURL(platform), { cache: "no-cache" });
        const json = await response.json();
        return VersionFileSchema.parse(json);
    } catch (error) {
        updateLogger.warn("Check update: failed to get available versions:", error);
        return undefined;
    }
}

export const getNewUpdateTestOnly = getNewUpdate;
export const releaseListSchemaTestOnly = VersionFileSchema;
