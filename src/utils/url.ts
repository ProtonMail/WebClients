import log from "electron-log";
import { getMailWindow, handleMailWindow } from "./windowManagement";

const sessionRegex = /(?!:\/u\/)(\d+)(?!:\/)/g;
export const getSessionID = (url: string) => {
    const pathName = new URL(url).pathname;
    return pathName.match(sessionRegex)?.[0];
};

export const handleMailToUrls = (url: string) => {
    log.info("Open mailto url and adding it to path");

    if (!url.startsWith("mailto:")) return;

    const mailWindow = getMailWindow();
    if (!mailWindow) return;
    handleMailWindow(mailWindow.webContents);

    const currentUrlString = mailWindow.webContents.getURL();
    try {
        const currentURL = new URL(currentUrlString);
        if (currentURL.hash) {
            log.info("URL already has a anchor");
            currentURL.hash.replace("#", "");
        }

        currentURL.hash = `#mailto=${url}`;
        mailWindow.webContents.loadURL(currentURL.toString());
    } catch (error) {
        log.error("Error while parsing mailto url");
    }
};
