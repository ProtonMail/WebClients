import {
    IPCInboxClientUpdateMessage,
    IPCInboxClientUpdateMessageType,
    IPCInboxDesktopFeature,
} from "@proton/shared/lib/desktop/desktopTypes";

export const DESKTOP_FEATURES = {
    InAppPayments: true,
    ThemeSelection: true,
    EarlyAccess: true,
    MultiAccount: true,
    LatestVersionCheck: true,
    InstallSource: true,
    MailtoTelemetry: true,
} as const satisfies Record<IPCInboxDesktopFeature, boolean>;

export type IPCHasFeatureMessage = {
    feature: keyof typeof DESKTOP_FEATURES;
    status: boolean;
};

export type IPCClientUpdateMessagePayload<T extends IPCInboxClientUpdateMessageType> = Extract<
    IPCInboxClientUpdateMessage,
    { type: T }
>["payload"];
