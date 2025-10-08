// Desktop features configuration for Meet
// These flags control which desktop-specific features are enabled
export const DESKTOP_FEATURES = {
    InAppPayments: false,
    EarlyAccess: false,
    LatestVersionCheck: true,
    InstallSource: true,
    HeartbeatMetrics: true,
    StatsTelemetry: true,
    ClearAppModal: true,
    // Disabled features (not used by Meet)
    ThemeSelection: false,
    FullTheme: false,
    RestrictedThemeSelection: false,
    MultiAccount: false,
    MailtoTelemetry: false,
    MailtoUpdate: false,
    ESUserChoice: false,
    StoreVersion: false,
} as const;

export type DesktopFeature = keyof typeof DESKTOP_FEATURES;
