/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum CommonFeatureFlag {
    ColorPerEventWeb = 'ColorPerEventWeb',
    AutoReloadPage = 'AutoReloadPage',
    DisableElectronMail = 'DisableElectronMail',
    SignedInAccountRecovery = 'SignedInAccountRecovery',
    KeyTransparencyShowUI = 'KeyTransparencyShowUI',
    KeyTransparencyLogOnly = 'KeyTransparencyLogOnly',
    EdDSAFaultySignatureCheck = 'EdDSAFaultySignatureCheck',
    CryptoDisableUndecryptableKeys = 'CryptoDisableUndecryptableKeys',
    CryptoCanaryOpenPGPjsV6 = 'CryptoCanaryOpenPGPjsV6',
    SplitStorage = 'SplitStorage',
    DrawerSecurityCenter = 'DrawerSecurityCenter',
    DrawerSecurityCenterDisplayPassAliases = 'DrawerSecurityCenterDisplayPassAliases',
    DrawerSecurityCenterDisplaySentinel = 'DrawerSecurityCenterDisplaySentinel',
}

enum AccountFlag {
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    DesktopAppUpsellModal = 'DesktopAppUpsellModal',
    Chargebee = 'Chargebee',
    ChargebeeSignups = 'ChargebeeSignups',
    ChargebeeMigration = 'ChargebeeMigration',
    ChargebeeFreeToPaid = 'ChargebeeFreeToPaid',
}

enum CalendarFeatureFlag {}
// CancelSingleOccurrenceWeb = 'CancelSingleOccurrenceWeb', removed with proton-calendar@5.0.21.0, can be removed from Unleash when FU'd

enum DriveFeatureFlag {
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
}

enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    EmailForwarding = 'EmailForwarding',
    DelightMailList = 'DelightMailList',
    DelightMailListHideUnreadButton = 'DelightMailListHideUnreadButton',
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${MailFeatureFlag}`;
