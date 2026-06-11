import { type DownloadItem, dialog } from "electron";
import { c } from "ttag";

import { mainLogger } from "./log";
import { appSession } from "./session";

const activeDownloads = new Set<DownloadItem>();

export const trackDownloads = () => {
    appSession().on("will-download", (_event, item) => {
        activeDownloads.add(item);
        mainLogger.info("download started", item.getFilename());

        item.once("done", (_doneEvent, state) => {
            activeDownloads.delete(item);
            mainLogger.info("download finished", state);
        });
    });
};

export const hasActiveDownloads = () => activeDownloads.size > 0;

export const confirmQuitWithActiveDownloads = (): boolean => {
    if (activeDownloads.size === 0) {
        return true;
    }

    const choice = dialog.showMessageBoxSync({
        type: "question",
        buttons: [c("Download warning").t`Continue downloading`, c("Download warning").t`Quit anyway`],
        defaultId: 0,
        cancelId: 0,
        title: c("Download warning").t`Recording download in progress`,
        message: c("Download warning").t`A recording is still being saved`,
        detail: c("Download warning").t`If you quit now, the file may be incomplete or empty. Quit anyway?`,
    });

    const quit = choice === 1;
    if (quit) {
        for (const item of activeDownloads) {
            try {
                item.cancel();
            } catch (error) {
                mainLogger.error("failed to cancel download on quit", error);
            }
        }
        activeDownloads.clear();
    }

    return quit;
};
