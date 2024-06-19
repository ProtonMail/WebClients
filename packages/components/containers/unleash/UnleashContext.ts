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
    ABTestSubscriptionReminder = 'ABTestSubscriptionReminder',
    CalendarBusyTimeSlots = 'CalendarBusyTimeSlots',
    InboxDesktopMultiAccountSupport = 'InboxDesktopMultiAccountSupport',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    InboxFreeUserRotatingButtonStyles = 'InboxFreeUserRotatingButtonStyles',
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
    ScimTenantCreation = 'ScimTenantCreation',
    InboxDesktopInAppPayments = 'InboxDesktopInAppPayments',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    LightLabellingFeatureModal = 'LightLabellingFeatureModal',
    NewCancellationFlow = 'NewCancellationFlow',
    DisableLoginPageBugReport = 'DisableLoginPageBugReport',
    ShowNoRecoveryMethodFlow = 'ShowNoRecoveryMethodFlow',
    ForgotRecoveryMethodStep = 'ForgotRecoveryMethodStep',
    ExtendCancellationProcess = 'ExtendCancellationProcess',
    B2BLogsPass = 'B2BLogsPass',
    SignedOutForgot2FAFlow = 'SignedOutForgot2FAFlow',
    SingleSignup = 'SingleSignup',
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
    // Upload
    DriveWebOptimisticUploadEnabled = 'DriveWebOptimisticUploadEnabled',
    DriveDocs = 'DriveDocs',
    DriveDocsDisabled = 'DriveDocsDisabled',
    DocsAppSwitcher = 'DocsAppSwitcher',
    // Bookmarks
    DriveShareURLBookmarks = 'DriveShareURLBookmarks',
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
}

enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
    ComposerAssistant = 'ComposerAssistant',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${MailFeatureFlag}`;
