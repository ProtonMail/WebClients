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
    BreachesSecurityCenter = 'BreachesSecurityCenter',
    InboxUpsellFlow = 'InboxUpsellFlow',
    ABTestInboxUpsellStep = 'ABTestInboxUpsellStep',
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
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    ScribeAdminSetting = 'ScribeAdminSetting',
    WalletRbf = 'WalletRbf',
    WalletAddressList = 'WalletAddressList',
    WalletMinFee = 'WalletMinFee',
    WalletAztecoWeb = 'WalletAztecoWeb',
    InboxDesktopDefaultEmailSetupHelper = 'InboxDesktopDefaultEmailSetupHelper',
    InboxDesktopDefaultEmailSetupHelperDisabled = 'InboxDesktopDefaultEmailSetupHelperDisabled',
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
    EduGainSSO = 'EduGainSSO',
    ChangePasswordStrengthIndicator = 'ChangePasswordStrengthIndicator',
}

enum PaymentsFlag {
    AllowDowncycling = 'AllowDowncycling',
    SepaPayments = 'SepaPayments',
    IpAddonDowngrade = 'IpAddonDowngrade',
    RegionalCurrenciesBatch2 = 'RegionalCurrenciesBatch2',
    TransactionsView = 'TransactionsView',
}

enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    VideoConferenceWidget = 'VideoConferenceWidget',
    CalendarRedux = 'CalendarRedux',
    // CancelSingleOccurrenceWeb = 'CancelSingleOccurrenceWeb', removed with proton-calendar@5.0.21.0, can be removed from Unleash when FU'd
    ZoomIntegration = 'ZoomIntegration',
    CalendarMetrics = 'CalendarMetrics',
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
    // Public sharing edit mode
    DrivePublicShareEditMode = 'DrivePublicShareEditMode',
    DrivePublicShareEditModeDisabled = 'DrivePublicShareEditModeDisabled',
    // Download
    DriveDownloadScan = 'DriveDownloadScan',
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    // Bookmarks
    DriveShareURLBookmarking = 'DriveShareURLBookmarking',
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    // Temp
    DriveDecryptionErrorDebugging = 'DriveDecryptionErrorDebugging',
    // B2B
    DriveB2BPhotosUpload = 'DriveB2BPhotosUpload',
    // Refactor
    DriveWebZustandShareMemberList = 'DriveWebZustandShareMemberList',
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
    MailOnboarding = 'MailOnboarding',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
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
