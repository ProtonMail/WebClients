/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum MailFeatureFlag {
    AttachmentThumbnails = 'AttachmentThumbnails',
    WebMailPageSizeSetting = 'WebMailPageSizeSetting',
}

enum AccountFlag {
    MaintenanceImporter = 'MaintenanceImporter',
}

enum DriveFeatureFlag {}

export type FeatureFlag = `${MailFeatureFlag}` | `${DriveFeatureFlag}` | `${AccountFlag}`;
