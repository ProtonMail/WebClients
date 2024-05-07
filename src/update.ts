import { autoUpdater } from "electron";
import Logger from "electron-log";
import { updateElectronApp } from "update-electron-app";
import pkg from "../package.json";
import { getPlatform } from "./utils/helpers";

export let updateDownloaded = false;
autoUpdater.on("update-downloaded", () => {
    updateDownloaded = true;
});

autoUpdater.on("before-quit-for-update", () => {
    updateDownloaded = true;
});

export const checkForUpdates = () => {
    Logger.info("checkForUpdates");

    // FIXME const updateInterval = 60*60*1000 // 1 hour
    const updateInterval = 5 * 60 * 1000; // 5 min

    setInterval(checkForUpdatesAndValidate, updateInterval)

};

const getVersionURL = (platform: string) => {
    // FIXME return `https://proton.me/download/mail/${platform}/version.json`;
    return `https://nexus.protontech.ch/service/rest/repository/browse/bridge-devel-builds/tmp/inda/${platform}/version.json`;
}


const fetchVersion = async (platform: DESKTOP_PLATFORMS): Promise<DesktopVersion[] | undefined> => {
    try {
        const response = await fetch(getDownloadUrl(`/mail/${platform}/version.json`));
        if (!response.ok) {
            throw new Error(response.statusText);
        }

        const res = await response.json();
        return res.Releases;
    } catch (e: any) {
        return undefined;
    }
};


const checkForUpdatesAndValidate = () => {
    // check version file
    const availableVersions = fetchVersion(getPlatform());

    // currentVersion
    // currentChannel
    // currentRollout

    // Option to trigger electron update directly:
    // fetch from github:
    //    autoUpdater.setFeedURL("github.com/....)
    // or download files to temp and update from there
    //    autoUpdater.setFeedURL(`file://${ global.tempPath }/RELEASE`)
    //
    // autoUpdater.checkUpdates()

    // Trigger update as usual

    updateElectronApp({
        repo: `${pkg.config.githubUser}/${pkg.config.githubRepo}`,
        // FIXME updateInterval: "1 hour",
        updateInterval: "5 min", // minimal
        logger: Logger,
    });
}
