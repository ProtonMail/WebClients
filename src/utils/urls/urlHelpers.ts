import { BrowserView } from "electron";

export const addHashToCurrentURL = (browserView: BrowserView, hash: string) => {
    const currentURLString = browserView.webContents.getURL();
    try {
        const currentURL = new URL(currentURLString);
        if (currentURL.hash) {
            currentURL.hash.replace("#", "");
        }
        currentURL.hash = hash;
        browserView.webContents.loadURL(currentURL.toString());
    } catch (error) {
        console.error("Error while parsing addHashToCurrentURL url");
    }
};
