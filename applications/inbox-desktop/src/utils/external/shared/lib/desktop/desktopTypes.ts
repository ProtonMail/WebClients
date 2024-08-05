import { DesktopVersion } from "../../../packages/components/containers/desktop/useInboxDesktopVersion";
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
export type IPCGetInfoMessage =
    | { type: "theme"; result: ThemeSetting }
    | { type: "latestVersion"; result: DesktopVersion | null };
export type IPCClientUpdateMessage =
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
export type IPCClientUpdateMessageType = IPCClientUpdateMessage["type"];
