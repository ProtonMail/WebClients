/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    EmailForwarding = 'EmailForwarding',
    SnoozeFeature = 'SnoozeFeature',
}

enum CommonFeatureFlag {
    ColorPerEventWeb = 'ColorPerEventWeb',
    DisableElectronMail = 'DisableElectronMail',
    SignedInAccountRecovery = 'SignedInAccountRecovery',
    KeyTransparencyShowUI = 'KeyTransparencyShowUI',
    KeyTransparencyLogOnly = 'KeyTransparencyLogOnly',
    EdDSAFaultySignatureCheck = 'EdDSAFaultySignatureCheck',
}

enum AccountFlag {
    TrustedDeviceRecovery = 'TrustedDeviceRecovery',
    MaintenanceImporter = 'MaintenanceImporter',
    BF2023OfferCheck = 'BF2023OfferCheck',
}

enum DriveFeatureFlag {
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
}

export type FeatureFlag = `${MailFeatureFlag}` | `${AccountFlag}` | `${DriveFeatureFlag}` | `${CommonFeatureFlag}`;
