/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum CommonFeatureFlag {
    ColorPerEventWeb = 'ColorPerEventWeb',
    CollectLogs = 'CollectLogs',
    CoreV6EventLoop = 'CoreV6EventLoop',
    AutoReloadPage = 'AutoReloadPage',
    DisableElectronMail = 'DisableElectronMail',
    // Whether to show Docs in the app switcher. NOT whether the docs homepage is enabled (that's `DocsHomepageEnabled` instead).
    // We'll clean up the naming of this flag in the future, if we don't remove it before then.
    DriveDocsLandingPageEnabled = 'DriveDocsLandingPageEnabled',
    KeyTransparencyShowUI = 'KeyTransparencyShowUI',
    KeyTransparencyLogOnly = 'KeyTransparencyLogOnly',
    CryptoDisableUndecryptableKeys = 'CryptoDisableUndecryptableKeys',
    InboxUpsellFlow = 'InboxUpsellFlow',
    CalendarBusyTimeSlots = 'CalendarBusyTimeSlots',
    CalendarHotkeys = 'CalendarHotkeys',
    InboxDesktopInAppPayments = 'InboxDesktopInAppPayments',
    InboxDesktopMultiAccountSupport = 'InboxDesktopMultiAccountSupport',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    InboxDesktopManualUpdateBannerDisabled = 'InboxDesktopManualUpdateBannerDisabled',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    WalletAutoSetup = 'WalletAutoSetup',
    SentinelRecoverySettings = 'SentinelRecoverySettings',
    InboxDesktopWinLinNewAppSwitcher = 'InboxDesktopWinLinNewAppSwitcher',
    DarkWebEmailNotifications = 'DarkWebEmailNotifications',
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    GoUnlimitedOffer2025 = 'GoUnlimitedOffer2025',
    ScribeAdminSetting = 'ScribeAdminSetting',
    SelfTroubleshoot = 'SelfTroubleshoot',
    WalletAztecoWeb = 'WalletAztecoWeb',
    WalletFullSync = 'WalletFullSync',
    VPNDrawer = 'VPNDrawer',
    InboxDesktopDefaultEmailSetupHelper = 'InboxDesktopDefaultEmailSetupHelper',
    InboxDesktopDefaultEmailSetupHelperDisabled = 'InboxDesktopDefaultEmailSetupHelperDisabled',
    InboxDesktopAppSessionCacheDisabled = 'InboxDesktopAppSessionCacheDisabled',
    // Monthly subscriber nudge feature flags
    SubscriberNudgeBundleMonthly = 'SubscriberNudgeBundleMonthly',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    SubscriberNudgeDriveMonthly = 'SubscriberNudgeDriveMonthly',
    B2BOnboarding = 'B2BOnboarding',
    InboxBringYourOwnEmail = 'InboxBringYourOwnEmail',
    InboxBringYourOwnEmailSignup = 'InboxBringYourOwnEmailSignup',
    CryptoEnforceOpenpgpGrammar = 'CryptoEnforceOpenpgpGrammar',
    ReferralExpansion = 'ReferralExpansion',
    AlwaysOnUpsell = 'AlwaysOnUpsell',
    LumoEarlyAccess = 'LumoEarlyAccess',
    LumoTooling = 'LumoTooling',
    LumoHighLoad = 'LumoHighLoad',
    LumoDeactivateGuestModeFrontend = 'LumoDeactivateGuestModeFrontend',
}

enum AccountFlag {
    AccountSessions = 'AccountSessions',
    MagicLink = 'MagicLink',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    PassTrialOffer = 'PassTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    BreachesAccountDashboard = 'BreachesAccountDashboard',
    NewCancellationFlow = 'NewCancellationFlow',
    B2BLogsPass = 'B2BLogsPass',
    B2BLogsVPN = 'B2BLogsVPN',
    B2BOrganizationMonitor = 'B2BOrganizationMonitor',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsMembersPermissionCheck = 'UserGroupsMembersPermissionCheck',
    B2BAuthenticationLogs = 'B2BAuthenticationLogs',
    EasySwitchConsentExperiment = 'EasySwitchConsentExperiment',
    EduGainSSO = 'EduGainSSO',
    PassB2BPasswordGenerator = 'PassB2BPasswordGenerator',
    SharedServerFeature = 'SharedServerFeature',
    PassB2BVaultCreation = 'PassB2BVaultCreation',
    PassB2BItemSharing = 'PassB2BItemSharing',
    CryptoPostQuantumOptIn = 'CryptoPostQuantumOptIn',
    PassB2BReports = 'PassB2BReports',
    DeleteAccountMergeReason = 'DeleteAccountMergeReason',
    VPNDashboard = 'VPNDashboard',
    PasswordPolicy = 'PasswordPolicy',
    EmergencyAccess = 'EmergencyAccess',
    SsoForPbs = 'SsoForPbs',
    DataRetentionPolicy = 'DataRetentionPolicy',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    SepaPaymentsB2C = 'SepaPaymentsB2C',
    TransactionsView = 'TransactionsView',
    VatId = 'VatId',
    PaymentsZipCodeValidation = 'PaymentsZipCodeValidation',
}

enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    VideoConferenceWidget = 'VideoConferenceWidget',
    ZoomIntegration = 'ZoomIntegration',
    CalendarMetrics = 'CalendarMetrics',
    CalendarCommander = 'CalendarCommander',
    RsvpCommentWeb = 'RsvpCommentWeb',
}

enum DriveFeatureFlag {
    // Photos
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
    // Sharing
    DriveSharingDisabled = 'DriveSharingDisabled',
    DriveSharingEditingDisabled = 'DriveSharingEditingDisabled',
    DriveExternalInvitationsDisabled = 'DriveSharingExternalInvitationsDisabled',
    DriveWebSharePageUpsell = 'DriveWebSharePageUpsell',
    // Public sharing edit mode
    DrivePublicShareEditMode = 'DrivePublicShareEditMode',
    DrivePublicShareEditModeDisabled = 'DrivePublicShareEditModeDisabled',
    // Download
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    // Bookmarks
    DriveShareURLBookmarksDisabled = 'DriveShareURLBookmarksDisabled',
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    // B2B
    DriveB2BPhotosUpload = 'DriveB2BPhotosUpload',
    // Experiment
    DriveWebDownloadMechanismParameters = 'DriveWebDownloadMechanismParameters',
    // Albums
    DriveAlbumsDisabled = 'DriveAlbumsDisabled',
    DriveAlbumOnboardingModal = 'DriveAlbumOnboardingModal',
    // One-dollar offer
    DrivePostSignupOneDollarPromo = 'DrivePostSignupOneDollarPromo',
    DriveWebRecoveryASV = 'DriveWebRecoveryASV',
    // Video Streaming
    // TODO: Convert to Kill-Switch once launched and tested
    DriveWebVideoStreaming = 'DriveWebVideoStreaming',
    // SDK Migration
    DriveWebSDKRenameModal = 'DriveWebSDKRenameModal',
    DriveWebSDKMoveItemsModal = 'DriveWebSDKMoveItemsModal',
    DriveWebSDKCreateFolderModal = 'DriveWebSDKCreateFolderModal',
    DriveWebSDKSharingModal = 'DriveWebSDKSharingModal',
    DriveWebSDKDevices = 'DriveWebSDKDevices',
    DriveWebSDKTrash = 'DriveWebSDKTrash',
    DriveWebSDKFileDetailsModal = 'DriveWebSDKFileDetailsModal',
    DriveWebSDKFolders = 'DriveWebSDKFolders',
    DriveWebSDKSharedByMe = 'DriveWebSDKSharedByMe',
    DriveWebSDKSharedWithMe = 'DriveWebSDKSharedWithMe',
    // Video Preview
    DriveWebVideoAutoPlay = 'DriveWebVideoAutoPlay',
}

enum DocsFeatureFlag {
    // General
    DriveDocsDisabled = 'DriveDocsDisabled',
    DownloadLogs = 'DownloadLogs',
    DocsAppSwitcher = 'DocsAppSwitcher',
    DocsPublicEditing = 'DocsPublicEditing',
    // Comments
    DocsEnableNotificationsOnNewComment = 'DocsEnableNotificationsOnNewComment',
    // Homepage
    DocsHomepageEnabled = 'DocsHomepageEnabled',
    // Public sharing
    DriveDocsPublicSharing = 'DriveDocsPublicSharing',
    DriveDocsPublicSharingDisabled = 'DriveDocsPublicSharingDisabled',
    // Suggestions
    DocsSuggestionsDisabled = 'DocsSuggestionsDisabled',
    // Sheets,
    DocsSheetsEnabled = 'DocsSheetsEnabled',
    DocsSheetsDisabled = 'DocsSheetsDisabled',
    // Update compression and chunking
    DocsUpdateCompressionEnabled = 'DocsUpdateCompressionEnabled',
    DocsUpdateChunkingEnabled = 'DocsUpdateChunkingEnabled',
    SheetsUpdateCompressionEnabled = 'SheetsUpdateCompressionEnabled',
    SheetsUpdateChunkingEnabled = 'SheetsUpdateChunkingEnabled',
}

enum MailFeatureFlag {
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
    PasswordNudge = 'PasswordNudge',
    PasswordNudgeForPaidUsers = 'PasswordNudgeForPaidUsers',
    ComposerAssistant = 'ComposerAssistant',
    WalletRightSidebarLink = 'WalletRightSidebarLink',
    ProtonTips = 'ProtonTips',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
    RemoveImageMetadata = 'RemoveImageMetadata',
    MailWebListTelemetry = 'MailWebListTelemetry',
    MailPostSignupOneDollarPromo = 'MailPostSignupOneDollarPromo',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    RemoveReplyStyles = 'RemoveReplyStyles',
    MailboxOptimisticRefactoring = 'MailboxOptimisticRefactoring',
    // Category view flags
    // Used to control the whole category view
    CategoryView = 'CategoryView',
    // Used for the alpha experiment of the category view will be deleted
    ShowMessageCategory = 'ShowMessageCategory',
    ApplyLabelsOptimisticRefactoring = 'ApplyLabelsOptimisticRefactoring',
}

enum AdminFeatureFlag {
    UserSecurityModal = 'UserSecurityModal',
}

enum WalletFlag {
    ImportPaperWallet = 'ImportPaperWallet',
    WalletDarkMode = 'WalletDarkMode',
    WalletMessageSigner = 'WalletMessageSigner',
    WalletExportTransaction = 'WalletExportTransaction',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${PaymentsFlag}`
    | `${CalendarFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${DocsFeatureFlag}`
    | `${MailFeatureFlag}`
    | `${AdminFeatureFlag}`
    | `${WalletFlag}`;
