import { TrialStatus } from "../store/trialStore";

export type IPCMessage =
    | { type: "updateNotification"; payload: number }
    | { type: "userLogout"; payload: undefined }
    | { type: "clearAppData"; payload: undefined }
    | { type: "oauthPopupOpened"; payload: "oauthPopupStarted" | "oauthPopupFinished" }
    | { type: "trialEnd"; payload: TrialStatus };

export type IPCMessageType = IPCMessage["type"];
export type IPCMessagePayload<T extends IPCMessageType> = Extract<IPCMessage, { type: T }>["payload"];
