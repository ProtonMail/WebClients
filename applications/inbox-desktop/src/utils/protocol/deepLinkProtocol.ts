import { app } from "electron";

export const DEEPLINK_PROTOCOL = "proton-inbox";

export const checkDeepLinks = () => {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL);
};

export enum DeepLinkActions {
    OpenMail = "open_mail",
    OpenCalendar = "open_calendar",
}
