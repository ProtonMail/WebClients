import {
    IPCInboxClientUpdateMessage,
    IPCInboxClientUpdateMessageType,
    IPCInboxDesktopFeature,
} from "../utils/external/packages/shared/lib/desktop/desktopTypes";

export const DESKTOP_FEATURES = {
    InAppPayments: true,
    ThemeSelection: true,
    EarlyAccess: true,
    MultiAccount: true,
    LatestVersionCheck: true,
} as const satisfies Record<IPCInboxDesktopFeature, boolean>;

export type IPCHasFeatureMessage = {
    feature: keyof typeof DESKTOP_FEATURES;
    status: boolean;
};

export type IPCClientUpdateMessagePayload<T extends IPCInboxClientUpdateMessageType> = Extract<
    IPCInboxClientUpdateMessage,
    { type: T }
>["payload"];
