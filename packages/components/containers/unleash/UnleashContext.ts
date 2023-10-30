/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum MailFeatureFlag {
    ExternalSSOWeb = 'ExternalSSOWeb',
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
    EmailForwarding = 'EmailForwarding',
}

enum AccountFlag {
    MaintenanceImporter = 'MaintenanceImporter',
    SignedInAccountRecovery = 'SignedInAccountRecovery',
    BF2023IsExpired = 'BF2023IsExpired',
}

enum DriveFeatureFlag {
    DrivePhotos = 'DrivePhotos',
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
}
export type FeatureFlag = `${MailFeatureFlag}` | `${AccountFlag}` | `${DriveFeatureFlag}`;
