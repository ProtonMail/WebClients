import { autoUpdater, session, app } from "electron";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import pkg from "../package.json";
import { getPlatform, DESKTOP_PLATFORMS, semver } from "./utils/helpers";
import { RELEASE_CATEGORIES } from "./constants";
import { getSettings } from "./store/settingsStore";
import { z } from "zod";
import { verifyDownloadCertificate } from "./utils/keyPinning";
import { updateLogger } from "./utils/log";

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

    const latest = ((): ReleaseInfo | undefined => {
        if (local.CategoryName === RELEASE_CATEGORIES.EARLY_ACCESS) {
            const latest_early = availableVersions.Releases.find(
                (r: ReleaseInfo) =>
                    r.CategoryName === RELEASE_CATEGORIES.EARLY_ACCESS || r.CategoryName === RELEASE_CATEGORIES.STABLE,
            );
            if (latest_early) {
                return latest_early;
            }
        }

        return availableVersions.Releases.find((r: ReleaseInfo) => r.CategoryName === RELEASE_CATEGORIES.STABLE);
    })();

    if (!latest) {
        updateLogger.warn(`Check update: failed to find latest versions for "${local.CategoryName}"`);
        return;
    }

    if (!isANewerThanB(latest.Version, local.Version)) {
        updateLogger.info("Skipping update: no newer version avaiable, local:", local, "latest:", latest);
        return;
    }

    if (local.RolloutProportion > latest.RolloutProportion) {
        updateLogger.info(
            "Skipping update: a newer version is available",
            latest,
            `but rollout is low, local:${local.RolloutProportion * 100}%`,
        );
        return;
    }

    updateLogger.info("New valid update found! Latest:", latest, "local:", local);

    validUpdate.Version = latest.Version;
    validUpdate.CategoryName = latest.CategoryName;
    validUpdate.RolloutProportion = latest.RolloutProportion;

    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.StaticStorage,
            baseUrl: `https://github.com/${pkg.config.githubUser}/${pkg.config.githubRepo}/releases/download/${latest.Version}`,
        },
        updateInterval: "5 min", // minimal
        logger: updateLogger,
    });
}

function getVersionURL(platform: DESKTOP_PLATFORMS) {
    return `https://proton.me/download/mail/${platform}/version.json`;
}

function isANewerThanB(a: string, b: string) {
    return semver(a) > semver(b);
}

function getAvailableVersions(platform: DESKTOP_PLATFORMS): Promise<ReleaseList | undefined> {
    const ses = session.fromPartition("persist:update", { cache: false });

    return ses
        .fetch(getVersionURL(platform), { cache: "no-cache" })
        .then((r) => r.json())
        .then((data) => releaseListSchema.parse(data))
        .then((unsortedVersions) => {
            return {
                Releases: unsortedVersions.Releases.sort((a: ReleaseInfo, b: ReleaseInfo) =>
                    Math.sign(semver(b.Version) - semver(a.Version)),
                ),
            };
        })
        .catch((e) => {
            updateLogger.warn("Check update: failed to get available versions:", e);
            return undefined;
        });
}
