import { app } from "electron";

export const DEEPLINK_PROTOCOL = "proton-meet";

export const checkDeepLinks = () => {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL);
};
