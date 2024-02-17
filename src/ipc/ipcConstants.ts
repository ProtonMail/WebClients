import { TrialStatus } from "../store/trialStore";

export type VIEW_TARGET = "mail" | "calendar" | "account";

export type IPCMessage =
    | { type: "updateNotification"; payload: number }
    | { type: "userLogout"; payload: undefined }
    | { type: "clearAppData"; payload: undefined }
    | { type: "oauthPopupOpened"; payload: "oauthPopupStarted" | "oauthPopupFinished" }
    | { type: "trialEnd"; payload: TrialStatus }
    | { type: "changeView"; payload: VIEW_TARGET };

export type IPCMessageType = IPCMessage["type"];
export type IPCMessagePayload<T extends IPCMessageType> = Extract<IPCMessage, { type: T }>["payload"];
