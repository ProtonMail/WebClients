/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
enum CommonFeatureFlag {
    ColorPerEventWeb = 'ColorPerEventWeb',
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
    // Monthly subscriber nudge feature flags
    SubscriberNudgeBundleMonthly = 'SubscriberNudgeBundleMonthly',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    SubscriberNudgeDriveMonthly = 'SubscriberNudgeDriveMonthly',
    B2BOnboarding = 'B2BOnboarding',
    InboxBringYourOwnEmail = 'InboxBringYourOwnEmail',
    InboxBringYourOwnEmailSignup = 'InboxBringYourOwnEmailSignup',
    LumoPlusFrontend = 'LumoPlusFrontend',
    CryptoEnforceOpenpgpGrammar = 'CryptoEnforceOpenpgpGrammar',
    ReferralExpansion = 'ReferralExpansion',
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
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsMembersPermissionCheck = 'UserGroupsMembersPermissionCheck',
    B2BAuthenticationLogs = 'B2BAuthenticationLogs',
    EasySwitchConsentExperiment = 'EasySwitchConsentExperiment',
    EduGainSSO = 'EduGainSSO',
    LumoInProductSwitcher = 'LumoInProductSwitcher',
    LumoAddonAvailable = 'LumoAddonAvailable',
    LumoSignupAvailable = 'LumoSignupAvailable',
    PassB2BPasswordGenerator = 'PassB2BPasswordGenerator',
    SharedServerFeature = 'SharedServerFeature',
    PassB2BVaultCreation = 'PassB2BVaultCreation',
    PassB2BItemSharing = 'PassB2BItemSharing',
    PassB2BReports = 'PassB2BReports',
    DeleteAccountMergeReason = 'DeleteAccountMergeReason',
    VPNDashboard = 'VPNDashboard',
    PasswordPolicy = 'PasswordPolicy',
    DwmTrialFree2025 = 'DwmTrialFree2025',
    SsoForPbs = 'SsoForPbs',
    DataRetentionPolicy = 'DataRetentionPolicy',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    SepaPaymentsB2C = 'SepaPaymentsB2C',
    TransactionsView = 'TransactionsView',
    ApplePayWeb = 'ApplePayWeb',
    VatId = 'VatId',
    ManualTrialsFE = 'ManualTrialsFE',
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
    DriveAlbums = 'DriveAlbums',
    DriveAlbumsDisabled = 'DriveAlbumsDisabled',
    DriveAlbumsNewVolumes = 'DriveAlbumsNewVolumes',
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
}

enum DocsFeatureFlag {
    // General
    DriveDocsDisabled = 'DriveDocsDisabled',
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
    MailboxRefactoring = 'MailboxRefactoring',
    NewsletterSubscriptionView = 'NewsletterSubscriptionView',
    RemoveReplyStyles = 'RemoveReplyStyles',
    MailboxOptimisticRefactoring = 'MailboxOptimisticRefactoring',

    // Category view flags
    // Used to control the whole category view
    CategoryView = 'CategoryView',
    // Used for the alpha experiment of the category view will be deleted
    ShowMessageCategory = 'ShowMessageCategory',
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
