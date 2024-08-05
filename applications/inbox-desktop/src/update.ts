import { autoUpdater, session, app } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import pkg from "../package.json";
import { getPlatform, semver } from "./utils/helpers";
import { getSettings } from "./store/settingsStore";
import { z } from "zod";
import { verifyDownloadCertificate } from "./utils/keyPinning";
import { updateLogger } from "./utils/log";
import { RELEASE_CATEGORIES } from "./utils/external/shared/lib/apps/desktopVersions";
import { DESKTOP_PLATFORMS } from "./utils/external/shared/lib/constants";

const releaseInfoSchema = z.object({
    Version: z.string(),
    RolloutProportion: z.number(),
    CategoryName: z.nativeEnum(RELEASE_CATEGORIES),
});
const releaseListSchema = z.object({
    Releases: z.array(releaseInfoSchema).nonempty(),
});
type ReleaseInfo = z.infer<typeof releaseInfoSchema>;
type ReleaseList = z.infer<typeof releaseListSchema>;

export let updateDownloaded = false;

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

const validUpdate = {} as ReleaseInfo;

async function checkForValidUpdates() {
    updateLogger.info("Checking for new valid version.");

    const platform = getPlatform();
    const settings = getSettings();
    const local = {
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

function getNewUpdate(local: ReleaseInfo, unorderedAvailableVersions: ReleaseList): ReleaseInfo | undefined {
    const availableVersions = {
        Releases: unorderedAvailableVersions.Releases.sort((a: ReleaseInfo, b: ReleaseInfo) =>
            Math.sign(semver(b.Version) - semver(a.Version)),
        ),
    };

    return ((): ReleaseInfo | undefined =>
        availableVersions.Releases.find((r: ReleaseInfo) => {
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

async function getAvailableVersions(platform: DESKTOP_PLATFORMS): Promise<ReleaseList | undefined> {
    const updateSession = session.fromPartition("persist:update", { cache: false });

    try {
        const response = await updateSession.fetch(getVersionURL(platform), { cache: "no-cache" });
        const json = await response.json();
        return releaseListSchema.parse(json);
    } catch (error) {
        updateLogger.warn("Check update: failed to get available versions:", error);
        return undefined;
    }
}

export const getNewUpdateTestOnly = getNewUpdate;
export const releaseListSchemaTestOnly = releaseListSchema;
export const releaseInfoSchemaTestOnly = releaseInfoSchema;
