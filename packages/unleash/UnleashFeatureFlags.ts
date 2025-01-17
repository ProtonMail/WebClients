/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum CommonFeatureFlag {
    ColorPerEventWeb = 'ColorPerEventWeb',
    AutoReloadPage = 'AutoReloadPage',
    DisableElectronMail = 'DisableElectronMail',
    KeyTransparencyShowUI = 'KeyTransparencyShowUI',
    KeyTransparencyLogOnly = 'KeyTransparencyLogOnly',
    CryptoDisableUndecryptableKeys = 'CryptoDisableUndecryptableKeys',
    InboxUpsellFlow = 'InboxUpsellFlow',
    CalendarBusyTimeSlots = 'CalendarBusyTimeSlots',
    InboxDesktopInAppPayments = 'InboxDesktopInAppPayments',
    InboxDesktopMultiAccountSupport = 'InboxDesktopMultiAccountSupport',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    InboxDesktopManualUpdateBannerDisabled = 'InboxDesktopManualUpdateBannerDisabled',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    WalletPlan = 'WalletPlan',
    WalletAutoSetup = 'WalletAutoSetup',
    SentinelRecoverySettings = 'SentinelRecoverySettings',
    InboxDesktopWinLinNewAppSwitcher = 'InboxDesktopWinLinNewAppSwitcher',
    DarkWebEmailNotifications = 'DarkWebEmailNotifications',
    InboxNewUpsellModals = 'InboxNewUpsellModals',
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    ScribeAdminSetting = 'ScribeAdminSetting',
    WalletRbf = 'WalletRbf',
    WalletAddressList = 'WalletAddressList',
    WalletAztecoWeb = 'WalletAztecoWeb',
    WalletFullSync = 'WalletFullSync',
}

enum AccountFlag {
    AccountSessions = 'AccountSessions',
    MagicLink = 'MagicLink',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    NewCancellationFlow = 'NewCancellationFlow',
    B2BLogsPass = 'B2BLogsPass',
    B2BLogsVPN = 'B2BLogsVPN',
    WalletAppSwitcherNewBadge = 'WalletAppSwitcherNewBadge',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsMembersPermissionCheck = 'UserGroupsMembersPermissionCheck',
    B2BAuthenticationLogs = 'B2BAuthenticationLogs',
    GlobalSSO = 'GlobalSSO',
    EasySwitchConsentExperiment = 'EasySwitchConsentExperiment',
    EduGainSSO = 'EduGainSSO',
    ChangePasswordStrengthIndicator = 'ChangePasswordStrengthIndicator',
    LumoInProductSwitcher = 'LumoInProductSwitcher',
    LumoAddonAvailable = 'LumoAddonAvailable',
    LumoSignupAvailable = 'LumoSignupAvailable',
    PassB2BPasswordGenerator = 'PassB2BPasswordGenerator',
    SharedServerFeature = 'SharedServerFeature',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    IpAddonDowngrade = 'IpAddonDowngrade',
    RegionalCurrenciesBatch2 = 'RegionalCurrenciesBatch2',
    TransactionsView = 'TransactionsView',
    ScheduledDowncycling = 'ScheduledDowncycling',
    BillingAddressModal = 'BillingAddressModal',
}

enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    VideoConferenceWidget = 'VideoConferenceWidget',
    CalendarRedux = 'CalendarRedux',
    ZoomIntegration = 'ZoomIntegration',
    CalendarMetrics = 'CalendarMetrics',
}

enum DriveFeatureFlag {
    // Photos
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
    // Sharing
    DriveSharingDisabled = 'DriveSharingDisabled',
    DriveSharingEditingDisabled = 'DriveSharingEditingDisabled',
    DriveExternalInvitationsDisabled = 'DriveSharingExternalInvitationsDisabled',
    // Public sharing edit mode
    DrivePublicShareEditMode = 'DrivePublicShareEditMode',
    DrivePublicShareEditModeDisabled = 'DrivePublicShareEditModeDisabled',
    // Download
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    DriveWebOPFSDownloadMechanism = 'DriveWebOPFSDownloadMechanism',
    // Bookmarks
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    // B2B
    DriveB2BPhotosUpload = 'DriveB2BPhotosUpload',
    // Refactor
    DriveWebZustandShareMemberList = 'DriveWebZustandShareMemberList',
    // Experiment
    DriveThumbnailWebP = 'DriveThumbnailWebP',
    DriveWebDownloadMechanismParameters = 'DriveWebDownloadMechanismParameters',
    // Albums
    DriveAlbums = 'DriveAlbums',
    DriveAlbumsDisabled = 'DriveAlbumsDisabled',
}

enum DocsFeatureFlag {
    // General
    DriveDocs = 'DriveDocs',
    DriveDocsDisabled = 'DriveDocsDisabled',
    DocsAppSwitcher = 'DocsAppSwitcher',
    DocsPublicEditing = 'DocsPublicEditing',
    // Comments
    DocsEnableNotificationsOnNewComment = 'DocsEnableNotificationsOnNewComment',
    // Landing page
    DriveDocsLandingPageEnabled = 'DriveDocsLandingPageEnabled',
    // Public sharing
    DriveDocsPublicSharing = 'DriveDocsPublicSharing',
    DriveDocsPublicSharingDisabled = 'DriveDocsPublicSharingDisabled',
    // Suggestions
    DriveDocsSuggestionModeEnabled = 'DriveDocsSuggestionModeEnabled',
    DocsSuggestionsDisabled = 'DocsSuggestionsDisabled',
}

enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
    ComposerAssistant = 'ComposerAssistant',
    ComposerAssistantFormatting = 'ComposerAssistantFormatting',
    WalletRightSidebarLink = 'WalletRightSidebarLink',
    ProtonTips = 'ProtonTips',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
    RemoveImageMetadata = 'RemoveImageMetadata',
    MailWebListTelemetry = 'MailWebListTelemetry',
    QuickReply = 'QuickReply',
    EmailWidgetSkeletonHidden = 'EmailWidgetSkeletonHidden',
    MailPostSignupOneDollarPromo = 'MailPostSignupOneDollarPromo',
}

enum AdminFeatureFlag {
    UserSecurityModal = 'UserSecurityModal',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${PaymentsFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${DocsFeatureFlag}`
    | `${MailFeatureFlag}`
    | `${AdminFeatureFlag}`;
