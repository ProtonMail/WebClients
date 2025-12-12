import { getMailView, showView } from "../view/viewManagement";
import { addHashToCurrentURL } from "./urlHelpers";
import { mainLogger } from "../log";
import telemetry from "../telemetry";

export const handleMailToUrls = (url: string): boolean => {
    if (!url.startsWith("mailto:")) return false;
    mainLogger.info("Open mailto url and adding it to path");

    const mailView = getMailView();
    if (!mailView) return true;

    telemetry.mailtoClicked();

    showView("mail", addHashToCurrentURL(mailView.webContents.getURL(), `#mailto=${url}`));
    return true;
};
