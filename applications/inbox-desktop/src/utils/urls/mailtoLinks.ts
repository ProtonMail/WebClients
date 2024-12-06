import { getMailView, showView } from "../view/viewManagement";
import { addHashToCurrentURL } from "./urlHelpers";
import { mainLogger } from "../log";
import telemetry from "../telemetry";

export const handleMailToUrls = (url: string) => {
    mainLogger.info("Open mailto url and adding it to path");

    if (!url.startsWith("mailto:")) return;

    const mailView = getMailView();
    if (!mailView) return;

    telemetry.mailtoClicked();

    showView("mail", addHashToCurrentURL(mailView.webContents.getURL(), `#mailto=${url}`));
};
