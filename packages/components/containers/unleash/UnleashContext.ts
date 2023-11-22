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
    DisableElectronMail = 'DisableElectronMail',
    SignedInAccountRecovery = 'SignedInAccountRecovery',
}

enum AccountFlag {
    MaintenanceImporter = 'MaintenanceImporter',
    BF2023IsExpired = 'BF2023IsExpired',
    BF2023OfferCheck = 'BF2023OfferCheck',
    SentinelPassPlus = 'SentinelPassPlus',
}

enum DriveFeatureFlag {
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
}

export type FeatureFlag = `${MailFeatureFlag}` | `${AccountFlag}` | `${DriveFeatureFlag}` | `${CommonFeatureFlag}`;
