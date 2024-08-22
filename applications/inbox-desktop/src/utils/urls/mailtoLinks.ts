import { getMailView, showView } from "../view/viewManagement";
import { addHashToCurrentURL } from "./urlHelpers";
import { mainLogger } from "../log";

export const handleMailToUrls = (url: string) => {
    mainLogger.info("Open mailto url and adding it to path");

    if (!url.startsWith("mailto:")) return;

    const mailView = getMailView();
    if (!mailView) return;

    showView("mail", addHashToCurrentURL(getMailView().webContents.getURL(), `#mailto=${url}`));
};
