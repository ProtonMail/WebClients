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
    LockedState = 'LockedState',
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
}

enum AccountFlag {
    MagicLink = 'MagicLink',
    PersistedState = 'PersistedState',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    AddressDeletion = 'AddressDeletion',
    NewCancellationFlow = 'NewCancellationFlow',
    B2BLogsPass = 'B2BLogsPass',
    SingleSignup = 'SingleSignup',
    UnprivatizeMember = 'UnprivatizeMember',
    B2BLogsVPN = 'B2BLogsVPN',
    WalletAppSwitcherNewBadge = 'WalletAppSwitcherNewBadge',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    SAMLTest = 'SamlTest',
    AllowDowncycling = 'AllowDowncycling',
    SecurityCheckup = 'SecurityCheckup',
    PassB2BForceLock = 'PassB2BForceLock',
    SignedInForgot2FAFlow = 'SignedInForgot2FAFlow',
    UserGroupsMembersPermissionCheck = 'UserGroupsMembersPermissionCheck',
    VpnSignupRegionalCurrency = 'VpnSignupRegionalCurrency',
    V2SignupRegionalCurrency = 'V2SignupRegionalCurrency',
    DashboardRegionalCurrency = 'DashboardRegionalCurrency',
}

enum CalendarFeatureFlag {
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    // CancelSingleOccurrenceWeb = 'CancelSingleOccurrenceWeb', removed with proton-calendar@5.0.21.0, can be removed from Unleash when FU'd
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
    DriveWebSharingLoadLinksByVolume = 'DriveWebSharingLoadLinksByVolume',
    // Download
    DriveDownloadScan = 'DriveDownloadScan',
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    // Docs
    DriveDocs = 'DriveDocs',
    DriveDocsDisabled = 'DriveDocsDisabled',
    DocsAppSwitcher = 'DocsAppSwitcher',
    DriveDocsSuggestionModeEnabled = 'DriveDocsSuggestionModeEnabled',
    DriveDocsPublicSharing = 'DriveDocsPublicSharing',
    DriveDocsPublicSharingDisabled = 'DriveDocsPublicSharingDisabled',
    // Bookmarks
    DriveShareURLBookmarking = 'DriveShareURLBookmarking',
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
    // TODO: DRVWEB-4064 - Clean this up
    DriveWebDownloadNewFolderLoaderAlgorithm = 'DriveWebDownloadNewFolderLoaderAlgorithm',
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
}

enum AdminFeatureFlag {
    UserSecurityModal = 'UserSecurityModal',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${MailFeatureFlag}`
    | `${AdminFeatureFlag}`;
