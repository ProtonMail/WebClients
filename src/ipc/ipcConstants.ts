import { ThemeSetting } from "../utils/themes";
import { TrialStatus } from "../store/trialStore";

export type VIEW_TARGET = "mail" | "calendar" | "account";
export type ElectronNotification = {
    title: string;
    body: string;
    app: VIEW_TARGET;
    elementID?: string;
    labelID?: string;
};

export type IPCMessage =
    | { type: "updateNotification"; payload: number }
    | { type: "userLogout"; payload: undefined }
    | { type: "clearAppData"; payload: undefined }
    | { type: "oauthPopupOpened"; payload: "oauthPopupStarted" | "oauthPopupFinished" }
    | { type: "openExternal"; payload: string }
    | { type: "trialEnd"; payload: TrialStatus }
    | { type: "changeView"; payload: VIEW_TARGET }
    | { type: "showNotification"; payload: ElectronNotification }
    | { type: "updateLocale"; payload: string }
    | { type: "setTheme"; payload: ThemeSetting };

export type IPCMessageType = IPCMessage["type"];
export type IPCMessagePayload<T extends IPCMessageType> = Extract<IPCMessage, { type: T }>["payload"];
