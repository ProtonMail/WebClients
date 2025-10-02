import { app } from "electron";

export const DEEPLINK_PROTOCOL = "proton-meet";

export const checkDeepLinks = () => {
    app.setAsDefaultProtocolClient(DEEPLINK_PROTOCOL);
};

export const handleDeepLink = () => {
    // Placeholder for future deep link handling
};

export const handleStartupDeepLink = () => {
    // Placeholder for future startup deep link handling
};
