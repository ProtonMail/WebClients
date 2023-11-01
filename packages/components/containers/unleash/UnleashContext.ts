/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    EmailForwarding = 'EmailForwarding',
}

enum AccountFlag {
    ExternalSSOWeb = 'ExternalSSOWeb',
    MaintenanceImporter = 'MaintenanceImporter',
    SignedInAccountRecovery = 'SignedInAccountRecovery',
    BF2023IsExpired = 'BF2023IsExpired',
    BF2023OfferCheck = 'BF2023OfferCheck',
    SentinelPassPlus = 'SentinelPassPlus',
}

enum DriveFeatureFlag {
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
}
export type FeatureFlag = `${MailFeatureFlag}` | `${AccountFlag}` | `${DriveFeatureFlag}`;
