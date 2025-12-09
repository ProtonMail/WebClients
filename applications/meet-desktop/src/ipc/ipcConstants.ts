import type { IPCInboxDesktopFeature } from "@proton/shared/lib/desktop/desktopTypes";

// Minimal feature set for Meet Desktop
export const DESKTOP_FEATURES = {
    EarlyAccess: true,
} as const satisfies Partial<Record<IPCInboxDesktopFeature, boolean>>;
