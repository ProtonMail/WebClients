import { autoUpdater, app } from "electron";
import Logger from "electron-log";
import { updateElectronApp, UpdateSourceType } from "update-electron-app";
import pkg from "../package.json";
import { getPlatform, DESKTOP_PLATFORMS, semver } from "./utils/helpers";

export enum UPDATE_CHANNEL {
    LIVE = "Stable",
    BETA = "EarlyAccess",
}

type ReleaseInfo = {
    Version: string;
    RolloutPercentage: number;
    CathegoryName: UPDATE_CHANNEL;
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
    const updateInterval = 5 * 60 * 1000; // 5 min

    setInterval(checkForValidUpdates, updateInterval)
};

const checkForValidUpdates = async () => {
    const local = {
        Version: app.getVersion(),
        RolloutPercentage: 100, // FIXME get local rollout
        CathegoryName: "Stable" // TODO get from web
    };

    const platform = getPlatform();
    if (!platform) {
        Logger.error("Failed to get platform.")
        return
    }

    // get version file
    const availableVersions = await getAvailableVersions(platform);
    if (!availableVersions) {
        Logger.warn("Failed to get available versions.")
        return
    }

    // find the latest version for given channel
    const latest = (() : ReleaseInfo | undefined => {
        if (local.CathegoryName == UPDATE_CHANNEL.BETA) {
            const latest_early = availableVersions.Releases.find((r: ReleaseInfo) => r.CathegoryName == UPDATE_CHANNEL.BETA);
            if (latest_early) {
                return latest_early;
            }
        }

        return availableVersions.Releases.find((r: ReleaseInfo) => r.CathegoryName == UPDATE_CHANNEL.LIVE)
    })();

    if (!latest) {
        Logger.warn(`Failed to find latest versions for "${local.CathegoryName}"`)
        return
    }

    if (!isANewerThanB(latest.Version, local.Version)) {
        Logger.info(`Skipping update: no newer version avaiable, local:"${local.Version}", latest:"${latest.Version}"`);
        return
    }

    /* 50
    if (local.RolloutPercentage > latest.RolloutPercentage) {
        Logger.info(`Skipping update: a newer version is available "${latest.Version}" but rollout is low, local:${local.RolloutPercentage}%, latest:${latest.RolloutPercentage}%`);
        return
    }
    */

   Logger.info(`New valid update available, version:"${latest.Version}", rollout:${latest.RolloutPercentage}%`)

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
    return `https://nexus.protontech.ch/service/rest/repository/browse/bridge-devel-builds/tmp/inda/${platform}/version.json`;
}

const isANewerThanB = (a: string, b:string) => {
    return semver(a) < semver(b);
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
