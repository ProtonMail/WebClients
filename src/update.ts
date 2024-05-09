import { autoUpdater, app } from "electron";
import Logger from "electron-log";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import pkg from "../package.json";
import { getPlatform, DESKTOP_PLATFORMS, semver } from "./utils/helpers";
import { RELEASE_CATEGORIES } from "./constants";
import { getSettings } from "./store/settingsStore";

type ReleaseInfo = {
    Version: string;
    RolloutProportion: number;
    CategoryName: RELEASE_CATEGORIES;
};

type ReleaseList = {
    Releases: ReleaseInfo[]
}

export let updateDownloaded = false;
autoUpdater.on("update-downloaded", () => {
    updateDownloaded = true;
});

autoUpdater.on("before-quit-for-update", () => {
    updateDownloaded = true;
});


// Checks available version in background and if there is valid version to
// update it will trigger update. Update interval is defined in function.
export const initializeUpdateChecks = () => {
    Logger.info("Initialization of update checks.");

    // FIXME const updateInterval = 60*60*1000 // 1 hour
    const updateInterval = 30 * 1000; // 5 min

    setInterval(checkForValidUpdates, updateInterval)
};

const checkForValidUpdates = async () => {
    Logger.info("Checking for new valid version.")

    const platform = getPlatform();
    if (!platform) {
        Logger.error("Check update: failed to get platform.")
        return
    }

    const settings = getSettings();
    const local = {
        Version: app.getVersion(),
        RolloutProportion: settings.rolloutProportion ? settings.rolloutProportion : 1,
        CategoryName: settings.releaseCategory ? settings.releaseCategory : RELEASE_CATEGORIES.STABLE // TODO get from web
    };


    // get version file
    const availableVersions = await getAvailableVersions(platform);
    if (!availableVersions) {
        Logger.warn("Check update: failed to get available versions.")
        return
    }

    // find the latest version for given channel
    const latest = (() : ReleaseInfo | undefined => {
        if (local.CategoryName === RELEASE_CATEGORIES.EARLY_ACCESS) {
            const latest_early = availableVersions.Releases.find((r: ReleaseInfo) => r.CategoryName === RELEASE_CATEGORIES.EARLY_ACCESS);
            if (latest_early) {
                return latest_early;
            }
        }

        return availableVersions.Releases.find((r: ReleaseInfo) => r.CategoryName === RELEASE_CATEGORIES.STABLE)
    })();

    if (!latest) {
        Logger.warn(`Check update: failed to find latest versions for "${local.CategoryName}"`)
        return
    }

    if (!isANewerThanB(latest.Version, local.Version)) {
        Logger.info(`Skipping update: no newer version avaiable, local:"${local.Version}", latest:"${latest.Version}"`);
        return
    }

    if (local.RolloutProportion > latest.RolloutProportion) {
        Logger.info(`Skipping update: a newer version is available "${latest.Version}" but rollout is low, local:${local.RolloutProportion*100}%, latest:${latest.RolloutProportion*100}%`);
        return
    }

   Logger.info(`New valid update found: version:"${latest.Version}", rollout:${latest.RolloutProportion*100}%`)

    updateElectronApp({
        updateSource: {
            type: UpdateSourceType.StaticStorage,
            baseUrl: `https://github.com/${pkg.config.githubUser}/${pkg.config.githubRepo}/releases/download/${latest.Version}`
        },
        updateInterval: "5 min", // minimal
        logger: Logger,
    });
}

const getVersionURL = (platform: string) => {
    // FIXME return `https://proton.me/download/mail/${platform}/version.json`;
    return `https://nexus.protontech.ch/repository/bridge-devel-builds/tmp/inda/${platform}/version.json`
}

const isANewerThanB = (a: string, b:string) => {
    return semver(a) > semver(b);
}


const getAvailableVersions = (platform: DESKTOP_PLATFORMS): Promise<ReleaseList | undefined> => {
    // FIXME create secure session for fetch (cert pinning)
    return fetch(getVersionURL(platform))
        .then((r) => r.json())
        .then((r: ReleaseList) => r)
        .catch((e)=>{
            Logger.warn("Failed to get available versions:", e)
            return undefined
        });
};
