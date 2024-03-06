import Logger from "electron-log";
import { getMailView, updateView } from "../view/viewManagement";

export const handleMailToUrls = (url: string) => {
    Logger.info("Open mailto url and adding it to path");

    if (!url.startsWith("mailto:")) return;

    const mailView = getMailView();
    if (!mailView) return;
    updateView("mail");

    const currentUrlString = mailView.webContents.getURL();
    try {
        const currentURL = new URL(currentUrlString);
        if (currentURL.hash) {
            Logger.info("URL already has a anchor");
            currentURL.hash.replace("#", "");
        }

        currentURL.hash = `#mailto=${url}`;
        mailView.webContents.loadURL(currentURL.toString());
    } catch (error) {
        Logger.error("Error while parsing mailto url");
    }
};
