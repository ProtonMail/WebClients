import Logger from "electron-log";
import { getMailView, showView } from "../view/viewManagement";
import { addHashToCurrentURL } from "./urlHelpers";

export const handleMailToUrls = (url: string) => {
    Logger.info("Open mailto url and adding it to path");

    if (!url.startsWith("mailto:")) return;

    const mailView = getMailView();
    if (!mailView) return;

    showView("mail");
    addHashToCurrentURL(mailView, `#mailto=${url}`);
};
