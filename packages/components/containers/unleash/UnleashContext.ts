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
    DrawerSecurityCenter = 'DrawerSecurityCenter',
    DrawerSecurityCenterDisplayPassAliases = 'DrawerSecurityCenterDisplayPassAliases',
    DrawerSecurityCenterDisplaySentinel = 'DrawerSecurityCenterDisplaySentinel',
    BreachesSecurityCenter = 'BreachesSecurityCenter',
    LockedState = 'LockedState',
    InboxUpsellFlow = 'InboxUpsellFlow',
    ABTestInboxUpsellStep = 'ABTestInboxUpsellStep',
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
    ScheduleB2BSupportPhoneCalls = 'ScheduleB2BSupportPhoneCalls',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    AddressDeletion = 'AddressDeletion',
    ScimTenantCreation = 'ScimTenantCreation',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    LightLabeling = 'LightLabeling',
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
}

enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${MailFeatureFlag}`;
