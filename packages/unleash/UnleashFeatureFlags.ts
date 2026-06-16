/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
export enum CommonFeatureFlag {
    AtkinsonHyperlegible = 'AtkinsonHyperlegible',
    ForceReload = 'ForceReload',
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
    InboxImportDedupByAddressKillSwitch = 'InboxImportDedupByAddressKillSwitch',
    CreateInboxBringYourOwnEmailDisabled = 'CreateInboxBringYourOwnEmailDisabled',
    ReferralExpansionDiscover = 'ReferralExpansionDiscover',
    ReferralFreeUsersDiscover = 'ReferralFreeUsersDiscover',
    AlwaysOnUpsell = 'AlwaysOnUpsell',
    LumoEarlyAccess = 'LumoEarlyAccess',
    LumoTooling = 'LumoTooling',
    LumoSmoothedRendering = 'LumoSmoothedRendering',
    LumoHighLoad = 'LumoHighLoad',
    LumoDeactivateGuestModeFrontend = 'LumoDeactivateGuestModeFrontend',
    LumoSignInHelp = 'LumoSignInHelp',
    AllowGuestInit = 'AllowGuestInit',
    NewScheduleOption = 'NewScheduleOption',
    PMVC2025 = 'PMVC2025',
    AutoAddMeetingLink = 'AutoAddMeetingLink',
    AvatarColorWeb = 'AvatarColorWeb',
    AuthenticatorSettingsEnabled = 'AuthenticatorSettingsEnabled',
    OlesM1 = 'OlesM1',
    OrganizationLevelEasySwitch = 'OrganizationLevelEasySwitch',
    WebNPSModal = 'WebNPSModal',
    MeetAddonCustomizer = 'MeetAddonCustomizer',
    WebApiRateLimiter = 'WebApiRateLimiter',
    PassSimpleLoginLifetimeOffer = 'PassSimpleLoginLifetimeOffer',
    MaxContactsImport = 'MaxContactsImport',
    EventLoopInterval = 'EventLoopInterval',
    DesktopDownloadApiEnabled = 'DesktopDownloadApiEnabled',
    LogWasmLoadingDisabled = 'LogWasmLoadingDisabled',
    PasswordReminders = 'PasswordReminders',
    MeetSpotlightType = 'MeetSpotlightType',
    DisablePostSubscriptionB2BOnboarding = 'DisablePostSubscriptionB2BOnboarding',
    EasySwitchB2CForDriveWeb = 'EasySwitchB2CForDriveWeb',
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
    VpnOrganizationLogRelayGatewayCreationMultiIp = 'VpnOrganizationLogRelayGatewayCreationMultiIp',
    VpnOrganizationLogRelayGatewayUpdateMultiIp = 'VpnOrganizationLogRelayGatewayUpdateMultiIp',
    B2BOrganizationMonitor = 'B2BOrganizationMonitor',
    B2BNonPrivateEmailPhone = 'B2BNonPrivateEmailPhone',
    B2BDarkWebMonitoring = 'B2BDarkWebMonitoring',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsGroupOwner = 'UserGroupsGroupOwner',
    EasySwitchOutlookSelectAccountDisabled = 'EasySwitchOutlookSelectAccountDisabled',
    EduGainSSO = 'EduGainSSO',
    PassB2BPasswordGenerator = 'PassB2BPasswordGenerator',
    SharedServerFeature = 'SharedServerFeature',
    PassB2BVaultCreation = 'PassB2BVaultCreation',
    PassB2BVaultCreationV2 = 'PassB2BVaultCreationV2',
    PassB2BItemSharing = 'PassB2BItemSharing',
    PassB2BSecureLinkSharing = 'PassB2BSecureLinkSharing',
    PassB2BAliasCreation = 'PassB2BAliasCreation',
    CryptoPostQuantumOptIn = 'CryptoPostQuantumOptIn',
    PassB2BReports = 'PassB2BReports',
    PassB2BPauseList = 'PassB2BPauseList',
    DeleteAccountMergeReason = 'DeleteAccountMergeReason',
    VPNDashboard = 'VPNDashboard',
    SsoForPbs = 'SsoForPbs',
    DataRetentionPolicy = 'DataRetentionPolicy',
    UserGroupsNoCustomDomain = 'UserGroupsNoCustomDomain',
    UserGroupsPassBusiness = 'UserGroupsPassBusiness',
    MailDashboard = 'MailDashboard',
    PassDashboard = 'PassDashboard',
    DriveDashboard = 'DriveDashboard',
    MeetDashboard = 'MeetDashboard',
    SocialRecoverySklDisabled = 'SocialRecoverySklDisabled',
    MembersRemote = 'MembersRemote',
    ShowLiteAppCheckoutV2 = 'ShowLiteAppCheckoutV2',
    AdminRoleMVP = 'AdminRoleMVP',
    MspEnabled = 'MspEnabled',
    UseZendeskV2 = 'UseZendeskV2',
    PurchaseAttributionSurveyEnabled = 'PurchaseAttributionSurveyEnabled',
    CancellationFlowFeedbackFirst = 'CancellationFlowFeedbackFirst',
    B2BSidebarRefreshEnabled = 'B2BSidebarRefreshEnabled',
    RecoverySettingsRedesign = 'RecoverySettingsRedesign',
    SystemGroupFlag = 'SystemGroupFlag',
    UnauthLost2FA = 'UnauthLost2FA',
    UnauthedForgotPassword = 'UnauthedForgotPassword',
    VPNReferralWithoutTrial = 'VPNReferralWithoutTrial',
    UserGroupsScimGroups = 'UserGroupsScimGroups',
    EnableZenDeskAIAgent = 'EnableZenDeskAIAgent',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    SepaPaymentsB2C = 'SepaPaymentsB2C',
    TransactionsView = 'TransactionsView',
    NewProtonBusinessBundlePlans = 'NewProtonBusinessBundlePlans',
    GooglePay = 'GooglePay',
    RegionalCurrenciesBatch3 = 'RegionalCurrenciesBatch3',
    PaypalRegionalCurrenciesBatch3 = 'PaypalRegionalCurrenciesBatch3',
    PaypalKrw = 'PaypalKrw',
    GreenlandOfferRegionalPaymentBlock = 'GreenlandOfferRegionalPaymentBlock',
    PaymentsValidateBillingAddress = 'PaymentsValidateBillingAddress',
    HideLumoAddonForVpn2024 = 'HideLumoAddonForVpn2024',
    DomainVpnBiz2023 = 'DomainVpnBiz2023',
    Vpn2024AddonsExperiment = 'Vpn2024AddonsExperiment',
}

export enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    CalendarMetrics = 'CalendarMetrics',
    RsvpCommentWeb = 'RsvpCommentWeb',
}

export enum CalendarKillSwitchFlag {
    ZoomIntegrationDisabled = 'ZoomIntegrationDisabled',
    CalendarExternalBookingsDisabled = 'CalendarExternalBookingsDisabled',
    CalendarBookingsDisabled = 'CalendarBookingsDisabled',
}

enum DriveFeatureFlag {
    // Kill switches
    DriveSharingDisabled = 'DriveSharingDisabled',
    DriveSharingEditingDisabled = 'DriveSharingEditingDisabled',
    DrivePublicShareEditModeDisabled = 'DrivePublicShareEditModeDisabled',
    DriveExternalInvitationsDisabled = 'DriveSharingExternalInvitationsDisabled',
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    // Rollouts
    DriveSharingAdminPermissions = 'DriveSharingAdminPermissions',
    DriveWebSearchFoundation = 'DriveWebSearchFoundation',
    // Offers
    DrivePostSignupOneDollarPromo = 'DrivePostSignupOneDollarPromo',
    DriveFreeMinutesUpload = 'DriveFreeMinutesUpload',
    DriveFreeMinutesUploadDisabled = 'DriveFreeMinutesUploadDisabled',
    // Promos
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    DriveWebSharePageUpsell = 'DriveWebSharePageUpsell',
    // Others
    DriveWebRecoveryASV = 'DriveWebRecoveryASV',
    DriveWebSDKMismatchDetection = 'DriveWebSDKMismatchDetection',
    DriveWebEncryptedThumbnailCache = 'DriveWebEncryptedThumbnailCache',
    // SDK rollouts — names should match @protontech/drive-sdk FeatureFlags enum, or have a manual mapping
    DriveCryptoEncryptBlocksWithPgpAead = 'DriveCryptoEncryptBlocksWithPgpAead',
    DriveSmallFileUpload = 'DriveSmallFileUpload',
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
    // SDK Migration
    DocsSharingModalDriveSDK = 'DocsSharingModalDriveSDK',
    DocsMoveModalDriveSDK = 'DocsMoveModalDriveSDK',
    DocsLoadRecentsWithDriveSDK = 'DocsLoadRecentsWithDriveSDK',
}

export enum MailFeatureFlag {
    PasswordNudge = 'PasswordNudge',
    PasswordNudgeForPaidUsers = 'PasswordNudgeForPaidUsers',
    ComposerAssistant = 'ComposerAssistant',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
    MailWebListTelemetry = 'MailWebListTelemetry',
    SubscriberNudgeMailMonthly = 'SubscriberNudgeMailMonthly',
    RemoveReplyStyles = 'RemoveReplyStyles',
    // Category view flags, used to control the whole category view
    CategoryView = 'CategoryView',
    // Attempt to fix the unability to save/send drafts on huge accounts
    PreventEventLoopCallOnCompose = 'PreventEventLoopCallOnCompose',
    MailStoreDebugMode = 'MailStoreDebugMode',
    OnlyInsertNewDataOnFetch = 'OnlyInsertNewDataOnFetch',
    //ML R&D
    LumoSieveHelper = 'LumoSieveHelper',
    ScribeToLumo = 'ScribeToLumo',
    OneTimePasscode = 'OneTimePasscode',
}

enum MailKillSwitchFlag {
    MailPostSignupOneDollarPromoDisabled = 'MailPostSignupOneDollarPromoDisabled',
    MailInfitiniteLoopRateLimiterDisabled = 'MailInfitiniteLoopRateLimiterDisabled',
    EncryptedSearchMigrationSystemDisabled = 'EncryptedSearchMigrationSystemDisabled',
    // Refreshed toolbar UI flags
    RefreshedToolbarUIDisabled = 'RefreshedToolbarUIDisabled',
    RawLinkParsingDisabled = 'RawLinkParsingDisabled',
    CategoryViewConversationPrefetchDisabled = 'CategoryViewConversationPrefetchDisabled',
}

enum AdminFeatureFlag {
    UserSecurityModal = 'UserSecurityModal',
    MLInsiderThreatAPIReportOnly = 'MLInsiderThreatAPIReportOnly',
    SplitLookup = 'SplitLookup',
    DriveAdminFileExplorer = 'DriveAdminFileExplorer',
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
    MeetCountdownUpsell = 'MeetCountdownUpsell',
    MeetRemainingTime = 'MeetRemainingTime',
    PersonalMeetingRotation = 'PersonalMeetingRotation',
    MeetPromptOnTabClose = 'MeetPromptOnTabClose',
    MeetSoundNotificationsEnabled = 'MeetSoundNotificationsEnabled',
    MeetNewJoinType = 'MeetNewJoinType',
    MeetNewSwitchJoinType = 'MeetNewSwitchJoinType',
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
    MeetQualityTelemetry = 'MeetQualityTelemetry',
    MeetWebClientDebug = 'MeetWebClientDebug',
    MeetE2eeDebugStats = 'MeetE2eeDebugStats',
    MeetE2eeAudioNoiseDetection = 'MeetE2eeAudioNoiseDetection',
    /** Uses shorter grace periods and lower concealment / stall thresholds (more recoverTrack churn). */
    MeetE2eeRecoveryAggressive = 'MeetE2eeRecoveryAggressive',
    MeetDashboardV2 = 'MeetDashboardV2',
    MeetDownloadDesktopAppEnabled = 'MeetDownloadDesktopAppEnabled',
    MeetDesktopAppBannerEnabled = 'MeetDesktopAppBannerEnabled',
    MeetFeedback = 'MeetFeedback',
    MeetFeedbackOnSkip = 'MeetFeedbackOnSkip',
    MeetPastMeetings = 'MeetPastMeetings',
    MeetE2eeDisableRecovery = 'MeetE2eeDisableRecovery',
    MeetShowReloadTrackButton = 'MeetShowReloadTrackButton',
    MeetH264 = 'MeetH264',
    MeetMultipleRecording = 'MeetMultipleRecording',
    MeetRecordingWebCodecs = 'MeetRecordingWebCodecs',
    MeetRecordingRecoveryUI = 'MeetRecordingRecoveryUI',
    MeetEnableAudioMixing = 'MeetEnableAudioMixing',
    MeetEnableSpatialAudio = 'MeetEnableSpatialAudio',
    MeetPreSharedKey = 'MeetPreSharedKey',
    MeetAdminLowerHand = 'MeetAdminLowerHand',
    MeetJoinTelemetry = 'MeetJoinTelemetry',
    MeetAdaptiveStream = 'MeetAdaptiveStream',
    MeetDynacast = 'MeetDynacast',
    MeetSimulcast = 'MeetSimulcast',
    MeetMeetingTimeout = 'MeetMeetingTimeout',
    MeetUseSimpleSegmentation = 'MeetUseSimpleSegmentation',
    MeetingRecorderRefactor = 'MeetingRecorderRefactor',
    MeetCoreWorker = 'MeetCoreWorker',
    MeetEnableScreenShareAudio = 'MeetEnableScreenShareAudio',
}

enum LumoFeatureFlag {
    LumoDarkMode = 'LumoDarkMode',
    WhatsNewV1p2 = 'WhatsNewV1p2',
    LumoSpecialTheme = 'LumoSpecialTheme',
    WhatsNewV1p3 = 'WhatsNewV1p3',
    LumoProjects = 'LumoProjects',
    LumoSmoothedRendering = 'LumoSmoothedRendering',
    LumoImageTools = 'LumoImageTools',
    LumoNativeComposer = 'LumoNativeComposer',
    LumoNativeComposerImage = 'LumoNativeComposerImage',
    LumoNativeComposerModelSelection = 'LumoNativeComposerModelSelection',
    LumoAPIKeyManagement = 'LumoAPIKeyManagement',
    LumoShowNextPromptSuggestions = 'LumoShowNextPromptSuggestions',
    LumoSurveys = 'LumoSurveys',
    LumoNewMarketingLinks = 'LumoNewMarketingLinks',
    LumoMeowmory = 'LumoMeowmory',
    LumoCustomAgents = 'LumoCustomAgents',
}

export type FeatureFlag =
    | `${CommonFeatureFlag}`
    | `${AccountFlag}`
    | `${PaymentsFlag}`
    | `${CalendarFeatureFlag}`
    | `${CalendarKillSwitchFlag}`
    | `${DriveFeatureFlag}`
    | `${DocsFeatureFlag}`
    | `${MailFeatureFlag}`
    | `${MailKillSwitchFlag}`
    | `${AdminFeatureFlag}`
    | `${WalletFlag}`
    | `${MeetFeatureFlag}`
    | `${LumoFeatureFlag}`;
