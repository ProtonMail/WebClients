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
    CryptoCanaryOpenPGPjsV6 = 'CryptoCanaryOpenPGPjsV6',
    BreachesSecurityCenter = 'BreachesSecurityCenter',
    InboxUpsellFlow = 'InboxUpsellFlow',
    ABTestInboxUpsellStep = 'ABTestInboxUpsellStep',
    ABTestInboxUpsellOneDollar = 'ABTestInboxUpsellOneDollar',
    ABTestSubscriptionReminder = 'ABTestSubscriptionReminder',
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
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    ScribeAdminSetting = 'ScribeAdminSetting',
    WalletRbf = 'WalletRbf',
    WalletAddressList = 'WalletAddressList',
    WalletMinFee = 'WalletMinFee',
    WalletAztecoWeb = 'WalletAztecoWeb',
}

enum AccountFlag {
    MagicLink = 'MagicLink',
    PersistedState = 'PersistedState',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    NewCancellationFlow = 'NewCancellationFlow',
    B2BLogsPass = 'B2BLogsPass',
    UnprivatizeMember = 'UnprivatizeMember',
    B2BLogsVPN = 'B2BLogsVPN',
    WalletAppSwitcherNewBadge = 'WalletAppSwitcherNewBadge',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsMembersPermissionCheck = 'UserGroupsMembersPermissionCheck',
    B2BAuthenticationLogs = 'B2BAuthenticationLogs',
    GlobalSSO = 'GlobalSSO',
    EasySwitchConsentExperiment = 'EasySwitchConsentExperiment',
}

enum PaymentsFlag {
    AllowDowncycling = 'AllowDowncycling',
    SepaPayments = 'SepaPayments',
}

enum CalendarFeatureFlag {
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    VideoConferenceWidget = 'VideoConferenceWidget',
    CalendarRedux = 'CalendarRedux',
    // CancelSingleOccurrenceWeb = 'CancelSingleOccurrenceWeb', removed with proton-calendar@5.0.21.0, can be removed from Unleash when FU'd
    ZoomIntegration = 'ZoomIntegration',
}

enum DriveFeatureFlag {
    // Photos
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
    // Sharing
    DriveSharingInvitations = 'DriveSharingInvitations',
    DriveSharingDisabled = 'DriveSharingDisabled',
    DriveSharingEditingDisabled = 'DriveSharingEditingDisabled',
    DriveSharingDevelopment = 'DriveSharingDevelopment',
    DriveExternalInvitationsDisabled = 'DriveSharingExternalInvitationsDisabled',
    DriveExternalInvitations = 'DriveSharingExternalInvitations',
    // Download
    DriveDownloadScan = 'DriveDownloadScan',
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    // Bookmarks
    DriveShareURLBookmarking = 'DriveShareURLBookmarking',
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    // New onboarding
    DriveWebOnboardingV2 = 'DriveWebOnboardingV2',
    // Temp
    DriveDecryptionErrorDebugging = 'DriveDecryptionErrorDebugging',
}

enum DocsFeatureFlag {
    // General
    DriveDocs = 'DriveDocs',
    DriveDocsDisabled = 'DriveDocsDisabled',
    DocsAppSwitcher = 'DocsAppSwitcher',
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
    MailOnboarding = 'MailOnboarding',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
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
