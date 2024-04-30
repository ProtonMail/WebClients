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
    EdDSAFaultySignatureCheck = 'EdDSAFaultySignatureCheck',
    CryptoDisableUndecryptableKeys = 'CryptoDisableUndecryptableKeys',
    CryptoCanaryOpenPGPjsV6 = 'CryptoCanaryOpenPGPjsV6',
    BreachesSecurityCenter = 'BreachesSecurityCenter',
    LockedState = 'LockedState',
    InboxUpsellFlow = 'InboxUpsellFlow',
    ABTestInboxUpsellStep = 'ABTestInboxUpsellStep',
    ABTestSubscriptionReminder = 'ABTestSubscriptionReminder',
    CalendarBusyTimeSlots = 'CalendarBusyTimeSlots',
}

enum AccountFlag {
    MailTrialOffer = 'MailTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    Chargebee = 'Chargebee',
    ChargebeeSignups = 'ChargebeeSignups',
    ChargebeeMigration = 'ChargebeeMigration',
    ChargebeeFreeToPaid = 'ChargebeeFreeToPaid',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    AddressDeletion = 'AddressDeletion',
    ScimTenantCreation = 'ScimTenantCreation',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    NewCancellationFlow = 'NewCancellationFlow',
}

enum CalendarFeatureFlag {
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    // CancelSingleOccurrenceWeb = 'CancelSingleOccurrenceWeb', removed with proton-calendar@5.0.21.0, can be removed from Unleash when FU'd
}

enum DriveFeatureFlag {
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
    DriveSharingDevelopment = 'DriveSharingDevelopment',
    DriveDownloadScan = 'DriveDownloadScan',
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    DriveWebOptimisticUploadEnabled = 'DriveWebOptimisticUploadEnabled',
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
