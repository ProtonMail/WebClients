/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
export enum CommonFeatureFlag {
    ColorPerEventWeb = 'ColorPerEventWeb',
    CollectLogs = 'CollectLogs',
    AutoReloadPage = 'AutoReloadPage',
    DisableElectronMail = 'DisableElectronMail',
    // Whether to show Docs in the app switcher. NOT whether the docs homepage is enabled (that's `DocsHomepageEnabled` instead).
    // We'll clean up the naming of this flag in the future, if we don't remove it before then.
    DriveDocsLandingPageEnabled = 'DriveDocsLandingPageEnabled',
    KeyTransparencyShowUI = 'KeyTransparencyShowUI',
    KeyTransparencyLogOnly = 'KeyTransparencyLogOnly',
    CryptoDisableUndecryptableKeys = 'CryptoDisableUndecryptableKeys',
    CalendarBusyTimeSlots = 'CalendarBusyTimeSlots',
    InboxDesktopInAppPayments = 'InboxDesktopInAppPayments',
    InboxDesktopMultiAccountSupport = 'InboxDesktopMultiAccountSupport',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    InboxDesktopManualUpdateBannerDisabled = 'InboxDesktopManualUpdateBannerDisabled',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    WalletAutoSetup = 'WalletAutoSetup',
    InboxDesktopWinLinNewAppSwitcher = 'InboxDesktopWinLinNewAppSwitcher',
    DarkWebEmailNotifications = 'DarkWebEmailNotifications',
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    GoUnlimitedOffer2025 = 'GoUnlimitedOffer2025',
    UnlimitedToDuoPermanentOffer = 'UnlimitedToDuoPermanentOffer',
    ScribeAdminSetting = 'ScribeAdminSetting',
    SelfTroubleshoot = 'SelfTroubleshoot',
    WalletAztecoWeb = 'WalletAztecoWeb',
    WalletFullSync = 'WalletFullSync',
    VPNDrawer = 'VPNDrawer',
    InboxDesktopDefaultEmailSetupHelper = 'InboxDesktopDefaultEmailSetupHelper',
    InboxDesktopDefaultEmailSetupHelperDisabled = 'InboxDesktopDefaultEmailSetupHelperDisabled',
    InboxDesktopAppSessionCacheDisabled = 'InboxDesktopAppSessionCacheDisabled',
    InboxDesktopBugReportLogAttachmentDisabled = 'InboxDesktopBugReportLogAttachmentDisabled',
    InboxDesktopSaveAsPdfPrintDialogDisabled = 'InboxDesktopSaveAsPdfPrintDialogDisabled',
    // Monthly subscriber nudge feature flags
    SubscriberNudgeBundleMonthly = 'SubscriberNudgeBundleMonthly',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    SubscriberNudgeDriveMonthly = 'SubscriberNudgeDriveMonthly',
    B2BOnboarding = 'B2BOnboarding',
    InboxBringYourOwnEmail = 'InboxBringYourOwnEmail',
    InboxBringYourOwnEmailClient = 'InboxBringYourOwnEmailClient',
    InboxBringYourOwnEmailSignup = 'InboxBringYourOwnEmailSignup',
    ReferralExpansionDiscover = 'ReferralExpansionDiscover',
    AlwaysOnUpsell = 'AlwaysOnUpsell',
    LumoEarlyAccess = 'LumoEarlyAccess',
    LumoTooling = 'LumoTooling',
    LumoSmoothedRendering = 'LumoSmoothedRendering',
    LumoHighLoad = 'LumoHighLoad',
    LumoDeactivateGuestModeFrontend = 'LumoDeactivateGuestModeFrontend',
    AllowGuestInit = 'AllowGuestInit',
    NewScheduleOption = 'NewScheduleOption',
    PMVC2025 = 'PMVC2025',
    AutoAddMeetingLink = 'AutoAddMeetingLink',
    AvatarColorWeb = 'AvatarColorWeb',
    AuthenticatorSettingsEnabled = 'AuthenticatorSettingsEnabled',
    OlesM1 = 'OlesM1',
    WebNPSModal = 'WebNPSModal',
    MeetPlans = 'MeetPlans',
    WebApiRateLimiter = 'WebApiRateLimiter',
    PassSimpleLoginLifetimeOffer = 'PassSimpleLoginLifetimeOffer',
    MaxContactsImport = 'MaxContactsImport',
    EventLoopInterval = 'EventLoopInterval',
}

enum AccountFlag {
    AccountSessions = 'AccountSessions',
    AccountSettingsUserDisableFE = 'AccountSettingsUserDisableFE',
    MagicLink = 'MagicLink',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    PassTrialOffer = 'PassTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    NewCancellationFlow = 'NewCancellationFlow',
    B2BLogsPass = 'B2BLogsPass',
    B2BLogsVPN = 'B2BLogsVPN',
    B2BOrganizationMonitor = 'B2BOrganizationMonitor',
    B2BNonPrivateEmailPhone = 'B2BNonPrivateEmailPhone',
    B2BDarkWebMonitoring = 'B2BDarkWebMonitoring',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsGroupOwner = 'UserGroupsGroupOwner',
    B2BAuthenticationLogs = 'B2BAuthenticationLogs',
    EasySwitchConsentExperiment = 'EasySwitchConsentExperiment',
    EduGainSSO = 'EduGainSSO',
    PassB2BPasswordGenerator = 'PassB2BPasswordGenerator',
    SharedServerFeature = 'SharedServerFeature',
    PassB2BVaultCreation = 'PassB2BVaultCreation',
    PassB2BVaultCreationV2 = 'PassB2BVaultCreationV2',
    PassB2BItemSharing = 'PassB2BItemSharing',
    CryptoPostQuantumOptIn = 'CryptoPostQuantumOptIn',
    PassB2BReports = 'PassB2BReports',
    PassB2BPauseList = 'PassB2BPauseList',
    DeleteAccountMergeReason = 'DeleteAccountMergeReason',
    VPNDashboard = 'VPNDashboard',
    SsoForPbs = 'SsoForPbs',
    DataRetentionPolicy = 'DataRetentionPolicy',
    UserGroupsNoCustomDomain = 'UserGroupsNoCustomDomain',
    MailDashboard = 'MailDashboard',
    PassDashboard = 'PassDashboard',
    DriveDashboard = 'DriveDashboard',
    MeetDashboard = 'MeetDashboard',
    FirstEmail = 'FirstEmail',
    SocialRecovery = 'SocialRecovery',
    Ipv6ForWgConfig = 'Ipv6ForWgConfig',
    MembersRemote = 'MembersRemote',
    ShowLiteAppCheckoutV2 = 'ShowLiteAppCheckoutV2',
    AdminRoleMVP = 'AdminRoleMVP',
    UseZendeskV2 = 'UseZendeskV2',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    SepaPaymentsB2C = 'SepaPaymentsB2C',
    TransactionsView = 'TransactionsView',
    PaymentsZipCodeValidation = 'PaymentsZipCodeValidation',
    NewProtonBusinessBundlePlans = 'NewProtonBusinessBundlePlans',
    GooglePay = 'GooglePay',
    RegionalCurrenciesBatch3 = 'RegionalCurrenciesBatch3',
    PaypalRegionalCurrenciesBatch3 = 'PaypalRegionalCurrenciesBatch3',
    PaypalKrw = 'PaypalKrw',
    GreenlandOfferRegionalPaymentBlock = 'GreenlandOfferRegionalPaymentBlock',
}

export enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    VideoConferenceWidget = 'VideoConferenceWidget',
    ZoomIntegration = 'ZoomIntegration',
    CalendarMetrics = 'CalendarMetrics',
    RsvpCommentWeb = 'RsvpCommentWeb',
    CalendarBookings = 'CalendarBookings',
    CalendarExternalBookings = 'CalendarExternalBookings',
    CalendarBookingsNoticeMode = 'CalendarBookingsNoticeMode',
    CalendarBookingsConflictCalendars = 'CalendarBookingsConflictCalendars',
}

enum DriveFeatureFlag {
    // Photos
    DrivePhotosUploadDisabled = 'DrivePhotosUploadDisabled',
    // Sharing
    DriveSharingDisabled = 'DriveSharingDisabled',
    DriveSharingEditingDisabled = 'DriveSharingEditingDisabled',
    DriveExternalInvitationsDisabled = 'DriveSharingExternalInvitationsDisabled',
    DriveWebSharePageUpsell = 'DriveWebSharePageUpsell',
    DriveSharingAdminPermissions = 'DriveSharingAdminPermissions',
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
    // Offers
    DrivePostSignupOneDollarPromo = 'DrivePostSignupOneDollarPromo',
    DriveFreeMinutesUpload = 'DriveFreeMinutesUpload',
    DriveFreeMinutesUploadDisabled = 'DriveFreeMinutesUploadDisabled',
    // Video Streaming
    // TODO: Convert to Kill-Switch once launched and tested
    DriveWebVideoStreaming = 'DriveWebVideoStreaming',
    // SDK Migration
    DriveWebSDKSharedWithMe = 'DriveWebSDKSharedWithMe',
    DriveWebSDKSidebar = 'DriveWebSDKSidebar',
    DriveWebSDKTransfer = 'DriveWebSDKTransfer',
    DriveWebSDKPhotosTransfer = 'DriveWebSDKPhotosTransfer',
    DriveWebSDKCopy = 'DriveWebSDKCopy',
    DriveWebSDKPreview = 'DriveWebSDKPreview',
    DriveWebSDKPublic = 'DriveWebSDKPublic',
    DriveWebSDKSearch = 'DriveWebSDKSearch',
    // Video Preview
    DriveWebVideoAutoPlay = 'DriveWebVideoAutoPlay',
    // Thumbnail Generation
    DriveWebNewThumbnailGeneration = 'DriveWebNewThumbnailGeneration',
    // Others
    DriveWebRecoveryASV = 'DriveWebRecoveryASV',
    // DriveWebNewFileBrowser
    DriveWebNewFileBrowser = 'DriveWebNewFileBrowser',
    // Foundation search libray
    DriveWebSearchFoundation = 'DriveWebSearchFoundation',
}

enum DocsFeatureFlag {
    // General
    DriveDocsDisabled = 'DriveDocsDisabled',
    DownloadLogs = 'DownloadLogs',
    DocsAppSwitcher = 'DocsAppSwitcher',
    DocsPublicEditing = 'DocsPublicEditing',
    DriveWebTextFileEdit = 'DriveWebTextFileEdit',
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
    SheetsEditorEnabled = 'SheetsEditorEnabled',
    SheetsODSImportEnabled = 'SheetsODSImportEnabled',
    SheetsODSExportEnabled = 'SheetsODSExportEnabled',
    // Update compression and chunking
    DocsUpdateCompressionEnabled = 'DocsUpdateCompressionEnabled',
    DocsUpdateChunkingEnabled = 'DocsUpdateChunkingEnabled',
    SheetsUpdateCompressionEnabled = 'SheetsUpdateCompressionEnabled',
    SheetsUpdateChunkingEnabled = 'SheetsUpdateChunkingEnabled',
    DocsClientSquashingEnabled = 'DocsClientSquashingEnabled',
    SheetsClientSquashingEnabled = 'SheetsClientSquashingEnabled',
    DocsClientSquashingDisabled = 'DocsClientSquashingDisabled',
    SheetsClientSquashingDisabled = 'SheetsClientSquashingDisabled',
}

export enum MailFeatureFlag {
    SelectAll = 'SelectAll',
    SelectAllOptimistic = 'SelectAllOptimistic',
    PasswordNudge = 'PasswordNudge',
    PasswordNudgeForPaidUsers = 'PasswordNudgeForPaidUsers',
    ComposerAssistant = 'ComposerAssistant',
    WalletRightSidebarLink = 'WalletRightSidebarLink',
    ProtonTips = 'ProtonTips',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
    MailWebListTelemetry = 'MailWebListTelemetry',
    MailPostSignupOneDollarPromo = 'MailPostSignupOneDollarPromo',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    RemoveReplyStyles = 'RemoveReplyStyles',
    // Category view flags
    // Used to control the whole category view
    CategoryView = 'CategoryView',
    // Used for the alpha experiment of the category view will be deleted
    ShowMessageCategory = 'ShowMessageCategory',
    // Attempt to fix the unability to save/send drafts on huge accounts
    PreventEventLoopCallOnCompose = 'PreventEventLoopCallOnCompose',
    FasterEncryptedSearchIndexing = 'FasterEncryptedSearchIndexing',
}

enum AdminFeatureFlag {
    UserSecurityModal = 'UserSecurityModal',
    MLInsiderThreatAPIReportOnly = 'MLInsiderThreatAPIReportOnly',
}

enum WalletFlag {
    ImportPaperWallet = 'ImportPaperWallet',
    WalletDarkMode = 'WalletDarkMode',
    WalletMessageSigner = 'WalletMessageSigner',
    WalletExportTransaction = 'WalletExportTransaction',
}

enum MeetFeatureFlag {
    MeetEarlyAccess = 'MeetEarlyAccess',
    MeetEarlyAccessPublic = 'MeetEarlyAccessPublic',
    MeetErrorReporting = 'MeetErrorReporting',
    MeetPassphraseEnabled = 'MeetPassphraseEnabled',
    MeetUpsell = 'MeetUpsell',
    PersonalMeetingRotation = 'PersonalMeetingRotation',
    MeetPromptOnTabClose = 'MeetPromptOnTabClose',
    MeetSoundNotificationsEnabled = 'MeetSoundNotificationsEnabled',
    MeetNewJoinType = 'MeetNewJoinType',
    MeetSwitchJoinType = 'MeetSwitchJoinType',
    MeetSeamlessKeyRotationEnabled = 'MeetSeamlessKeyRotationEnabled',
    MeetShowUpsellModalAfterMeeting = 'MeetShowUpsellModalAfterMeeting',
    MeetShowMLSLogs = 'MeetShowMLSLogs',
    MeetingRecording = 'MeetingRecording',
    MeetAllowNewHostAssignment = 'MeetAllowNewHostAssignment',
    MeetAllowMLSLogExport = 'MeetAllowMLSLogExport',
    MeetAllowDecryptionErrorReporting = 'MeetAllowDecryptionErrorReporting',
    MeetClientMetricsLog = 'MeetClientMetricsLog',
    MeetVp9 = 'MeetVp9',
    MeetHigherBitrate = 'MeetHigherBitrate',
    MeetScheduleInAdvance = 'MeetScheduleInAdvance',
    MeetProtonCalendarDeepLink = 'MeetProtonCalendarDeepLink',
    MeetUnblockAudioButton = 'MeetUnblockAudioButton',
    MeetOpenLinksInDesktopApp = 'MeetOpenLinksInDesktopApp',
    MeetDebugMode = 'MeetDebugMode',
    MeetSinglePeerConnection = 'MeetSinglePeerConnection',
    MeetQualityTelemetry = 'MeetQualityTelemetry',
    MeetAllowLiveKitDebugReporting = 'MeetAllowLiveKitDebugReporting',
    MeetDashboardV2 = 'MeetDashboardV2',
    MeetDownloadDesktopAppEnabled = 'MeetDownloadDesktopAppEnabled',
    MeetDesktopAppBannerEnabled = 'MeetDesktopAppBannerEnabled',
    MeetFeedback = 'MeetFeedback',
    MeetPastMeetings = 'MeetPastMeetings',
}

enum LumoFeatureFlag {
    LumoDarkMode = 'LumoDarkMode',
    WhatsNewV1p2 = 'WhatsNewV1p2',
    LumoSpecialTheme = 'LumoSpecialTheme',
    WhatsNewV1p3 = 'WhatsNewV1p3',
    LumoProjects = 'LumoProjects',
    LumoSmoothedRendering = 'LumoSmoothedRendering',
    LumoImageTools = 'LumoImageTools',
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
    | `${WalletFlag}`
    | `${MeetFeatureFlag}`
    | `${LumoFeatureFlag}`;
