import { BrowserWindow } from "electron";
import log from "electron-log";
import { getMailView, loadMailView } from "../view/viewManagement";

export const handleMailToUrls = (url: string) => {
    log.info("Open mailto url and adding it to path");

    if (!url.startsWith("mailto:")) return;

    const mailView = getMailView();
    if (!mailView) return;
    // TODO: check if still useful or rest of code is sufficient
    loadMailView(BrowserWindow.getFocusedWindow());

    const currentUrlString = mailView.webContents.getURL();
    try {
        const currentURL = new URL(currentUrlString);
        if (currentURL.hash) {
            log.info("URL already has a anchor");
            currentURL.hash.replace("#", "");
        }

        currentURL.hash = `#mailto=${url}`;
        mailView.webContents.loadURL(currentURL.toString());
    } catch (error) {
        log.error("Error while parsing mailto url");
    }
};
