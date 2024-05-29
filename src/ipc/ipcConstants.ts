import { ThemeSetting } from "../utils/themes";
import { Environment } from "../constants";

export const DESKTOP_FEATURES = {
    InAppPayments: true,
    ThemeSelection: true,
    EarlyAccess: true,
    MultiAccount: true,
} as const;

export type VIEW_TARGET = "mail" | "calendar" | "account";
export type ElectronNotification = {
    title: string;
    body: string;
    app: VIEW_TARGET;
    elementID?: string;
    labelID?: string;
};

export type IPCHasFeatureMessage = {
    feature: keyof typeof DESKTOP_FEATURES;
    status: boolean;
};

export type IPCGetInfoMessage = { type: "theme"; result: ThemeSetting };

export type IPCClientUpdateMessage =
    | { type: "updateNotification"; payload: number }
    | { type: "userLogin"; payload?: undefined }
    | { type: "userLogout"; payload?: undefined }
    | { type: "clearAppData"; payload?: undefined }
    | { type: "oauthPopupOpened"; payload: "oauthPopupStarted" | "oauthPopupFinished" }
    | { type: "subscriptionModalOpened"; payload: "subscriptionModalStarted" | "subscriptionModalFinished" }
    | { type: "openExternal"; payload: string }
    | { type: "trialEnd"; payload: undefined }
    | { type: "changeView"; payload: VIEW_TARGET }
    | { type: "showNotification"; payload: ElectronNotification }
    | { type: "updateLocale"; payload: string }
    | { type: "setTheme"; payload: ThemeSetting }
    | { type: "earlyAccess"; payload: Environment | undefined };

export type IPCClientUpdateMessageType = IPCClientUpdateMessage["type"];
export type IPCClientUpdateMessagePayload<T extends IPCClientUpdateMessageType> = Extract<
    IPCClientUpdateMessage,
    { type: T }
>["payload"];
