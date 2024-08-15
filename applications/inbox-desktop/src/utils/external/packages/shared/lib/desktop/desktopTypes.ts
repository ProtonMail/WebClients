import { DesktopVersion } from "./DesktopVersion";
import { Environment } from "../interfaces/Environment";
import { ThemeSetting } from "../themes/themes";

export type CHANGE_VIEW_TARGET = "mail" | "calendar" | "account";
export type ElectronNotification = {
    title: string;
    body: string;
    app: CHANGE_VIEW_TARGET;
    elementID?: string;
    labelID?: string;
};

export type IPCInboxDesktopFeature =
    | "ThemeSelection"
    | "InAppPayments"
    | "EarlyAccess"
    | "MultiAccount"
    | "LatestVersionCheck";
export type IPCInboxGetInfoMessage =
    | { type: "theme"; result: ThemeSetting }
    | { type: "latestVersion"; result: DesktopVersion | null };
export type IPCInboxClientUpdateMessage =
    | { type: "updateNotification"; payload: number }
    | { type: "userLogin"; payload?: undefined }
    | { type: "userLogout"; payload?: undefined }
    | { type: "clearAppData"; payload?: undefined }
    | { type: "oauthPopupOpened"; payload: "oauthPopupStarted" | "oauthPopupFinished" }
    | { type: "subscriptionModalOpened"; payload: "subscriptionModalStarted" | "subscriptionModalFinished" }
    | { type: "openExternal"; payload: string }
    | { type: "trialEnd"; payload: undefined }
    | { type: "changeView"; payload: CHANGE_VIEW_TARGET }
    | { type: "showNotification"; payload: ElectronNotification }
    | { type: "updateLocale"; payload: string }
    | { type: "setTheme"; payload: ThemeSetting }
    | { type: "earlyAccess"; payload: Environment | undefined };
export type IPCInboxClientUpdateMessageType = IPCInboxClientUpdateMessage["type"];
export type IPCInboxHostUpdateMessage = {
    type: "captureMessage";
    payload: {
        message: string;
        level: "error" | "warning";
        tags: Record<string, string | number>;
        extra: Record<string, string | number>;
    };
};
export type IPCInboxHostUpdateMessageType = IPCInboxHostUpdateMessage["type"];

export type IPCInboxMessageBroker = {
    hasFeature?: (feature: IPCInboxDesktopFeature) => boolean;
    getInfo?: <T extends IPCInboxGetInfoMessage["type"]>(
        type: T,
    ) => Extract<IPCInboxGetInfoMessage, { type: T }>["result"];
    on?: <T extends IPCInboxHostUpdateMessageType>(
        type: T,
        callback: (payload: Extract<IPCInboxHostUpdateMessage, { type: T }>["payload"]) => void,
    ) => { removeListener: () => void };
    send?: <T extends IPCInboxClientUpdateMessageType>(
        type: T,
        payload: Extract<IPCInboxClientUpdateMessage, { type: T }>["payload"],
    ) => void;
};
