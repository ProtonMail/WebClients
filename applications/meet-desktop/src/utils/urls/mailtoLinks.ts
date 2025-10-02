import { getMailView, showView } from "../view/viewManagement";
import { addHashToCurrentURL } from "./urlHelpers";
import { mainLogger } from "../log";
import telemetry from "../telemetry";

export const handleMailToUrls = (url: string) => {
    if (!url.startsWith("mailto:")) return;
    mainLogger.info("Open mailto url and adding it to path");

    const mailView = getMailView();
    if (!mailView) return;

    telemetry.mailtoClicked();

    showView("mail", addHashToCurrentURL(mailView.webContents.getURL(), `#mailto=${url}`));
};
