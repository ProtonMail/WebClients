// Desktop features configuration for Meet
// These flags control which desktop-specific features are enabled
export const DESKTOP_FEATURES = {
    InAppPayments: true,
    ThemeSelection: true,
    EarlyAccess: true,
    LatestVersionCheck: true,
    InstallSource: true,
    FullTheme: true,
    HeartbeatMetrics: true,
    StatsTelemetry: true,
    RestrictedThemeSelection: true,
    ClearAppModal: true,
    // Disabled mail/calendar-specific features
    MultiAccount: false,
    MailtoTelemetry: false,
    MailtoUpdate: false,
    ESUserChoice: false,
    StoreVersion: false,
} as const;

export type DesktopFeature = keyof typeof DESKTOP_FEATURES;
