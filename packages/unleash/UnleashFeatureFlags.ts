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
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    Wallet = 'Wallet',
    WalletPlan = 'WalletPlan',
    DuoPlan = 'DuoPlan',
    WalletAutoSetup = 'WalletAutoSetup',
    SentinelRecoverySettings = 'SentinelRecoverySettings',
    LeftSidebarCollapsible = 'LeftSidebarCollapsible',
}

enum AccountFlag {
    MagicLink = 'MagicLink',
    PersistedState = 'PersistedState',
    AIAssistantToggleKillSwitch = 'AIAssistantToggleKillSwitch',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    Chargebee = 'Chargebee',
    ChargebeeSignups = 'ChargebeeSignups',
    ChargebeeMigration = 'ChargebeeMigration',
    ChargebeeFreeToPaid = 'ChargebeeFreeToPaid',
    ChargebeeFreeToPaidB2B = 'ChargebeeFreeToPaidB2B',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    AddressDeletion = 'AddressDeletion',
    LightLabellingFeatureModal = 'LightLabellingFeatureModal',
    NewCancellationFlow = 'NewCancellationFlow',
    ExtendCancellationProcess = 'ExtendCancellationProcess',
    B2BLogsPass = 'B2BLogsPass',
    SingleSignup = 'SingleSignup',
    B2BLogsVPN = 'B2BLogsVPN',
    WalletAppSwitcherNewBadge = 'WalletAppSwitcherNewBadge',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    WalletSignup = 'WalletSignup',
    WalletEASignup = 'WalletEASignup',
    SAMLTest = 'SamlTest',
    AllowDowncycling = 'AllowDowncycling',
    SecurityCheckup = 'SecurityCheckup',
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
    // Download
    DriveDownloadScan = 'DriveDownloadScan',
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    // Docs
    DriveDocs = 'DriveDocs',
    DriveDocsDisabled = 'DriveDocsDisabled',
    DocsAppSwitcher = 'DocsAppSwitcher',
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
    WalletRightSidebarLink = 'WalletRightSidebarLink',
    ProtonTips = 'ProtonTips',
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
