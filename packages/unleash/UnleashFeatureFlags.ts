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
    CalendarHotkeys = 'CalendarHotkeys',
    InboxDesktopInAppPayments = 'InboxDesktopInAppPayments',
    InboxDesktopMultiAccountSupport = 'InboxDesktopMultiAccountSupport',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    InboxDesktopManualUpdateBannerDisabled = 'InboxDesktopManualUpdateBannerDisabled',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    WalletAutoSetup = 'WalletAutoSetup',
    SentinelRecoverySettings = 'SentinelRecoverySettings',
    InboxDesktopWinLinNewAppSwitcher = 'InboxDesktopWinLinNewAppSwitcher',
    DarkWebEmailNotifications = 'DarkWebEmailNotifications',
    InboxNewUpsellModals = 'InboxNewUpsellModals',
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    ScribeAdminSetting = 'ScribeAdminSetting',
    SelfTroubleshoot = 'SelfTroubleshoot',
    WalletAztecoWeb = 'WalletAztecoWeb',
    WalletFullSync = 'WalletFullSync',
    VPNDrawer = 'VPNDrawer',
    InboxDesktopDefaultEmailSetupHelper = 'InboxDesktopDefaultEmailSetupHelper',
    InboxDesktopDefaultEmailSetupHelperDisabled = 'InboxDesktopDefaultEmailSetupHelperDisabled',
    // Monthly subscriber nudge feature flags
    SubscriberNudgeBundleMonthly = 'SubscriberNudgeBundleMonthly',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    SubscriberNudgeDriveMonthly = 'SubscriberNudgeDriveMonthly',
}

enum AccountFlag {
    AccountSessions = 'AccountSessions',
    MagicLink = 'MagicLink',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    PassTrialOffer = 'PassTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    NewCancellationFlow = 'NewCancellationFlow',
    B2BLogsPass = 'B2BLogsPass',
    B2BLogsVPN = 'B2BLogsVPN',
    AccessControl = 'AccessControl',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsMembersPermissionCheck = 'UserGroupsMembersPermissionCheck',
    B2BAuthenticationLogs = 'B2BAuthenticationLogs',
    EasySwitchConsentExperiment = 'EasySwitchConsentExperiment',
    EduGainSSO = 'EduGainSSO',
    LumoInProductSwitcher = 'LumoInProductSwitcher',
    LumoAddonAvailable = 'LumoAddonAvailable',
    LumoSignupAvailable = 'LumoSignupAvailable',
    PassB2BPasswordGenerator = 'PassB2BPasswordGenerator',
    SharedServerFeature = 'SharedServerFeature',
    PassB2BVaultCreation = 'PassB2BVaultCreation',
    PassB2BItemSharing = 'PassB2BItemSharing',
    PassB2BReports = 'PassB2BReports',
    DeleteAccountMergeReason = 'DeleteAccountMergeReason',
    VPNDashboard = 'VPNDashboard',
    QRCodeSignIn = 'QRCodeSignIn',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    IpAddonDowngrade = 'IpAddonDowngrade',
    RegionalCurrenciesBatch2 = 'RegionalCurrenciesBatch2',
    TransactionsView = 'TransactionsView',
    ScheduledDowncycling = 'ScheduledDowncycling',
    BillingAddressModal = 'BillingAddressModal',
    EditInvoiceDetails = 'EditInvoiceDetails',
    PassLifetimeFrontend = 'PassLifetimeFrontend',
}

enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    VideoConferenceWidget = 'VideoConferenceWidget',
    ZoomIntegration = 'ZoomIntegration',
    CalendarMetrics = 'CalendarMetrics',
    CalendarCommander = 'CalendarCommander',
    RsvpCommentWeb = 'RsvpCommentWeb',
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
    // Bookmarks
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    // B2B
    DriveB2BPhotosUpload = 'DriveB2BPhotosUpload',
    // Experiment
    DriveWebDownloadMechanismParameters = 'DriveWebDownloadMechanismParameters',
    DriveWebSafariSearch = 'DriveWebSafariSearch',
    DriveWebIWADSupport = 'DriveWebIWADSupport',
    // Albums
    DriveAlbums = 'DriveAlbums',
    DriveAlbumsDisabled = 'DriveAlbumsDisabled',
    // One-dollar offer
    DrivePostSignupOneDollarPromo = 'DrivePostSignupOneDollarPromo',
    DriveWebRecoveryASV = 'DriveWebRecoveryASV',
}

enum DocsFeatureFlag {
    // General
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
    DocsSuggestionsDisabled = 'DocsSuggestionsDisabled',
}

enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
    PasswordNudge = 'PasswordNudge',
    PasswordNudgeForPaidUsers = 'PasswordNudgeForPaidUsers',
    ComposerAssistant = 'ComposerAssistant',
    WalletRightSidebarLink = 'WalletRightSidebarLink',
    ProtonTips = 'ProtonTips',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
    RemoveImageMetadata = 'RemoveImageMetadata',
    MailWebListTelemetry = 'MailWebListTelemetry',
    QuickReply = 'QuickReply',
    MailPostSignupOneDollarPromo = 'MailPostSignupOneDollarPromo',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    MailboxRefactoring = 'MailboxRefactoring',
}

enum AdminFeatureFlag {
    UserSecurityModal = 'UserSecurityModal',
}

enum WalletFlag {
    ImportPaperWallet = 'ImportPaperWallet',
    WalletDarkMode = 'WalletDarkMode',
    WalletMessageSigner = 'WalletMessageSigner',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${PaymentsFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${DocsFeatureFlag}`
    | `${MailFeatureFlag}`
    | `${AdminFeatureFlag}`
    | `${WalletFlag}`;
