/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */

enum AccountB2BFeatureFlag {
    AccountSettingsUserDisableFE = 'AccountSettingsUserDisableFE',
    AdminRoleMVP = 'AdminRoleMVP',
    AdminRolesWithMSP = 'AdminRolesWithMSP',
    DataRetentionPolicy = 'DataRetentionPolicy',
    MembersRemote = 'MembersRemote',
    SsoForPbs = 'SsoForPbs',
    SyncOwnerRoleClientKillSwitch = 'SyncOwnerRoleClientKillSwitch',
    UserGroupsGroupOwner = 'UserGroupsGroupOwner',
    UserGroupsNoCustomDomain = 'UserGroupsNoCustomDomain',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsScimGroups = 'UserGroupsScimGroups',
}

enum AccountCryptoFeatureFlag {
    CryptoPostQuantumOptIn = 'CryptoPostQuantumOptIn',
}

enum AccountFeatureFlag {
    CancellationFlowFeedbackFirst = 'CancellationFlowFeedbackFirst',
    DisableSsoBackupPassword = 'DisableSsoBackupPassword',
    DriveDashboard = 'DriveDashboard',
    DriveTrialOffer = 'DriveTrialOffer',
    EduGainSSO = 'EduGainSSO',
    EnableZenDeskAIAgent = 'EnableZenDeskAIAgent',
    MailTrialOffer = 'MailTrialOffer',
    NewCancellationFlow = 'NewCancellationFlow',
    PassTrialOffer = 'PassTrialOffer',
    ShowLiteAppCheckoutV2 = 'ShowLiteAppCheckoutV2',
    SocialRecoverySklDisabled = 'SocialRecoverySklDisabled',
    SpacesAvailable = 'SpacesAvailable',
    VisionarySignup = 'VisionarySignup',
    VPNDashboard = 'VPNDashboard',
    VPNReferralWithoutTrial = 'VPNReferralWithoutTrial',
    WorldCupRetention = 'WorldCupRetention',
}

enum AccountMSAFeatureFlag {
    B2BDarkWebMonitoring = 'B2BDarkWebMonitoring',
    B2BNonPrivateEmailPhone = 'B2BNonPrivateEmailPhone',
    MSPStorageOptionEnabled = 'MSPStorageOptionEnabled',
}

enum AccountVPNFeatureFlag {
    B2BAlwaysOnWindowsRelease = 'B2BAlwaysOnWindowsRelease',
    SharedServerFeature = 'SharedServerFeature',
    VpnB2bUserActivity = 'VpnB2bUserActivity',
    VpnOrganizationLogRelayGatewayCreationMultiIp = 'VpnOrganizationLogRelayGatewayCreationMultiIp',
    VpnOrganizationLogRelayGatewayUpdateMultiIp = 'VpnOrganizationLogRelayGatewayUpdateMultiIp',
}

type AccountProjectFeatureFlag =
    | `${AccountB2BFeatureFlag}`
    | `${AccountCryptoFeatureFlag}`
    | `${AccountFeatureFlag}`
    | `${AccountMSAFeatureFlag}`
    | `${AccountVPNFeatureFlag}`;

enum ActivationFeatureFlag {
    MaintenanceImporter = 'MaintenanceImporter',
}

enum AdminFeatureFlag {
    MLInsiderThreatAPIReportOnly = 'MLInsiderThreatAPIReportOnly',
    SplitLookup = 'SplitLookup',
    UserSecurityModal = 'UserSecurityModal',
}

export enum CalendarFeatureFlag {
    AutoAddDisabledE2EEAttendees = 'AutoAddDisabledE2EEAttendees',
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    CalendarMetrics = 'CalendarMetrics',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    NGCWebAccess = 'NGCWebAccess',
    RsvpCommentWeb = 'RsvpCommentWeb',
}

export enum CalendarKillSwitchFlag {
    CalendarBookingsDisabled = 'CalendarBookingsDisabled',
    CalendarExternalBookingsDisabled = 'CalendarExternalBookingsDisabled',
    ZoomIntegrationDisabled = 'ZoomIntegrationDisabled',
}

export enum CommonFeatureFlag {
    AlwaysOnUpsell = 'AlwaysOnUpsell',
    AuthenticatorSettingsEnabled = 'AuthenticatorSettingsEnabled',
    AutoAddMeetingLink = 'AutoAddMeetingLink',
    AvatarColorWeb = 'AvatarColorWeb',
    B2BAlwaysOnEnabled = 'B2BAlwaysOnEnabled',
    B2BOnboarding = 'B2BOnboarding',
    B2BSidebarRefreshEnabled = 'B2BSidebarRefreshEnabled',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    CalendarBusyTimeSlots = 'CalendarBusyTimeSlots',
    CentralisedOffersDelivery = 'CentralisedOffersDelivery',
    CollectLogs = 'CollectLogs',
    ColorPerEventWeb = 'ColorPerEventWeb',
    CreateInboxBringYourOwnEmailDisabled = 'CreateInboxBringYourOwnEmailDisabled',
    CryptoDisableUndecryptableKeys = 'CryptoDisableUndecryptableKeys',
    DarkWebEmailNotifications = 'DarkWebEmailNotifications',
    DesktopDownloadApiEnabled = 'DesktopDownloadApiEnabled',
    DisableElectronMail = 'DisableElectronMail',
    DisablePostSubscriptionB2BOnboarding = 'DisablePostSubscriptionB2BOnboarding',
    // Whether to show Docs in the app switcher. NOT whether the docs homepage is enabled (that's `DocsHomepageEnabled` instead).
    // We'll clean up the naming of this flag in the future, if we don't remove it before then.
    DriveDocsLandingPageEnabled = 'DriveDocsLandingPageEnabled',
    EasySwitchB2CForDriveWeb = 'EasySwitchB2CForDriveWeb',
    EasySwitchB2CForDriveWebNewUI = 'EasySwitchB2CForDriveWebNewUI',
    EasySwitchB2CForDriveWebSidebarRollout = 'EasySwitchB2CForDriveWebSidebarRollout',
    EasySwitchOutlookSelectAccountDisabled = 'EasySwitchOutlookSelectAccountDisabled',
    EventLoopInterval = 'EventLoopInterval',
    ForceReload = 'ForceReload',
    GoUnlimitedOffer2025 = 'GoUnlimitedOffer2025',
    InboxBringYourOwnEmail = 'InboxBringYourOwnEmail',
    InboxBringYourOwnEmailClient = 'InboxBringYourOwnEmailClient',
    InboxBringYourOwnEmailSignup = 'InboxBringYourOwnEmailSignup',
    InboxDesktopAppSessionCacheDisabled = 'InboxDesktopAppSessionCacheDisabled',
    InboxDesktopBugReportLogAttachmentDisabled = 'InboxDesktopBugReportLogAttachmentDisabled',
    InboxDesktopCategoryViewSettingsToggleReloadDisabled = 'InboxDesktopCategoryViewSettingsToggleReloadDisabled',
    InboxDesktopDefaultEmailSetupHelperDisabled = 'InboxDesktopDefaultEmailSetupHelperDisabled',
    InboxDesktopDefaultEmailSetupHelperDisabledV2 = 'InboxDesktopDefaultEmailSetupHelperDisabledV2',
    InboxDesktopInAppPayments = 'InboxDesktopInAppPayments',
    InboxDesktopManualUpdateBannerDisabled = 'InboxDesktopManualUpdateBannerDisabled',
    InboxDesktopMultiAccountSupport = 'InboxDesktopMultiAccountSupport',
    InboxDesktopSaveAsPdfPrintDialogDisabled = 'InboxDesktopSaveAsPdfPrintDialogDisabled',
    InboxDesktopThemeSelection = 'InboxDesktopThemeSelection',
    InboxDesktopWinLinNewAppSwitcher = 'InboxDesktopWinLinNewAppSwitcher',
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    KeyTransparencyLogOnly = 'KeyTransparencyLogOnly',
    KeyTransparencyShowUI = 'KeyTransparencyShowUI',
    LogWasmLoadingDisabled = 'LogWasmLoadingDisabled',
    LumoDeactivateGuestModeFrontend = 'LumoDeactivateGuestModeFrontend',
    LumoEarlyAccess = 'LumoEarlyAccess',
    LumoHighLoad = 'LumoHighLoad',
    LumoSignInHelp = 'LumoSignInHelp',
    LumoSmoothedRendering = 'LumoSmoothedRendering',
    LumoTooling = 'LumoTooling',
    MailPostSignupZeroNinetyNinePromo = 'MailPostSignupZeroNinetyNinePromo',
    MaxContactsImport = 'MaxContactsImport',
    MeetSpotlightType = 'MeetSpotlightType',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    NewScheduleOption = 'NewScheduleOption',
    Oles365 = 'Oles365',
    OrganizationLevelEasySwitch = 'OrganizationLevelEasySwitch',
    PassSimpleLoginLifetimeOffer = 'PassSimpleLoginLifetimeOffer',
    PingOMatic = 'PingOMatic',
    Q3Sale2026FreeToUnlimitedSecondPopup = 'Q3Sale2026FreeToUnlimitedSecondPopup',
    ReferralExpansionDiscover = 'ReferralExpansionDiscover',
    ReferralFreeUsersDiscover = 'ReferralFreeUsersDiscover',
    ScribeAdminSetting = 'ScribeAdminSetting',
    SelfTroubleshoot = 'SelfTroubleshoot',
    // Monthly subscriber nudge kill switches (default off; enable to hide the nudge)
    SubscriberNudgeBundleMonthlyDisabled = 'SubscriberNudgeBundleMonthlyDisabled',
    SubscriberNudgeDriveMonthlyDisabled = 'SubscriberNudgeDriveMonthlyDisabled',
    SubscriberNudgeMailMonthlyDisabled = 'SubscriberNudgeMailMonthlyDisabled',
    UnlimitedToDuoPermanentOffer = 'UnlimitedToDuoPermanentOffer',
    VPNDrawer = 'VPNDrawer',
    WalletAztecoWeb = 'WalletAztecoWeb',
    WalletFullSync = 'WalletFullSync',
    WebApiRateLimiter = 'WebApiRateLimiter',
    WebNPSModal = 'WebNPSModal',
}

enum DocsFeatureFlag {
    // General
    DocsAppSwitcher = 'DocsAppSwitcher',
    DocsDarkTheme = 'DocsDarkTheme',
    DocsGatePrivateInviteAccess = 'DocsGatePrivateInviteAccess',
    DocsODTEnabled = 'DocsODTEnabled',
    DocsOpenTracer = 'DocsOpenTracer',
    DocsPublicEditing = 'DocsPublicEditing',
    DownloadLogs = 'DownloadLogs',
    DriveDocsDisabled = 'DriveDocsDisabled',
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
    // Sheets
    DocsSheetsDisabled = 'DocsSheetsDisabled',
    DocsSheetsEnabled = 'DocsSheetsEnabled',
    SheetsActionsStorageEnabled = 'SheetsActionsStorageEnabled',
    SheetsCustomDateTimeFormatEnabled = 'SheetsCustomDateTimeFormatEnabled',
    SheetsCustomNumberFormatEnabled = 'SheetsCustomNumberFormatEnabled',
    SheetsDriftDetectionEnabled = 'SheetsDriftDetectionEnabled',
    SheetsEditorEnabled = 'SheetsEditorEnabled',
    SheetsMountAfterInitialLoadDisabled = 'SheetsMountAfterInitialLoadDisabled',
    SheetsODSExportEnabled = 'SheetsODSExportEnabled',
    SheetsODSImportEnabled = 'SheetsODSImportEnabled',
    SheetsPatchesStorageEnabled = 'SheetsPatchesStorageEnabled',
    SheetsStatusBarEnabled = 'SheetsStatusBarEnabled',
    SheetsTablesEnabled = 'SheetsTablesEnabled',
    // Update compression and chunking
    DocsClientSquashingDisabled = 'DocsClientSquashingDisabled',
    DocsClientSquashingEnabled = 'DocsClientSquashingEnabled',
    DocsUpdateChunkingEnabled = 'DocsUpdateChunkingEnabled',
    DocsUpdateCompressionEnabled = 'DocsUpdateCompressionEnabled',
    SheetsClientSquashingDisabled = 'SheetsClientSquashingDisabled',
    SheetsClientSquashingEnabled = 'SheetsClientSquashingEnabled',
    SheetsUpdateChunkingEnabled = 'SheetsUpdateChunkingEnabled',
    SheetsUpdateCompressionEnabled = 'SheetsUpdateCompressionEnabled',
    // SDK Migration
    DocsDocumentViewerEventsSDK = 'DocsDocumentViewerEventsSDK',
    DocsDriveCompatSDK = 'DocsDriveCompatSDK',
    DocsInvitationsDriveSDK = 'DocsInvitationsDriveSDK',
    DocsLoadRecentsWithDriveSDK = 'DocsLoadRecentsWithDriveSDK',
    DocsMoveModalDriveSDK = 'DocsMoveModalDriveSDK',
    DocsRenameWithDriveSDK = 'DocsRenameWithDriveSDK',
    DocsSharingModalDriveSDK = 'DocsSharingModalDriveSDK',
    DocsTrashWithDriveSDK = 'DocsTrashWithDriveSDK',
}

enum DriveFeatureFlag {
    // Kill switches
    DriveDownloadScanDisabled = 'DriveDownloadScanDisabled',
    DriveExternalInvitationsDisabled = 'DriveSharingExternalInvitationsDisabled',
    DrivePublicShareEditModeDisabled = 'DrivePublicShareEditModeDisabled',
    DriveSharingDisabled = 'DriveSharingDisabled',
    DriveSharingEditingDisabled = 'DriveSharingEditingDisabled',
    // Rollouts
    DriveSharingAdminPermissions = 'DriveSharingAdminPermissions',
    DriveWebSearchFoundation = 'DriveWebSearchFoundation',
    // Offers
    DriveFreeMinutesUpload = 'DriveFreeMinutesUpload',
    DriveFreeMinutesUploadDisabled = 'DriveFreeMinutesUploadDisabled',
    DrivePostSignupOneDollarPromo = 'DrivePostSignupOneDollarPromo',
    // Promos
    DriveWebSharePageUpsell = 'DriveWebSharePageUpsell',
    DriveWebShareURLSignupModal = 'DriveWebShareURLSignupModal',
    // Others
    DriveWebEncryptedThumbnailCache = 'DriveWebEncryptedThumbnailCache',
    DriveWebRecoveryASV = 'DriveWebRecoveryASV',
    DriveWebReportAbuseDirectShare = 'DriveWebReportAbuseDirectShare',
    DriveWebSDKMismatchDetection = 'DriveWebSDKMismatchDetection',
    // SDK rollouts — names should match @protontech/drive-sdk FeatureFlags enum, or have a manual mapping
    DriveCryptoEncryptBlocksWithPgpAead = 'DriveCryptoEncryptBlocksWithPgpAead',
    DriveSmallFileUpload = 'DriveSmallFileUpload',
    // Spotlight
    DriveWebSharingAdminTooltip = 'DriveWebSharingAdminTooltip',
    // Lumo in Drive
    DriveWebLumo = 'DriveWebLumo',
    DriveWebLumoDestructiveActionsDisabled = 'DriveWebLumoDestructiveActionsDisabled',
}

enum LumoFeatureFlag {
    LumoAiPaperTrail = 'LumoAiPaperTrail',
    LumoAiPaperTrailPopup = 'LumoAiPaperTrailPopup',
    LumoAiPaperTrailRoute = 'LumoAiPaperTrailRoute',
    LumoApertusModel = 'LumoApertusModel',
    LumoAPIKeyManagement = 'LumoAPIKeyManagement',
    LumoArtifactsView = 'LumoArtifactsView',
    LumoArtifactsViewSpotlight = 'LumoArtifactsViewSpotlight',
    LumoCustomAgents = 'LumoCustomAgents',
    LumoDarkMode = 'LumoDarkMode',
    LumoDictationV2 = 'LumoDictationV2',
    LumoImageTools = 'LumoImageTools',
    LumoMaxAvailableFree = 'LumoMaxAvailableFree',
    LumoMaxAvailableGuest = 'LumoMaxAvailableGuest',
    LumoMeowmory = 'LumoMeowmory',
    LumoNativeAuthAndroid = 'LumoNativeAuthAndroid',
    LumoNativeAuthIOS = 'LumoNativeAuthIOS',
    LumoNativeComposer = 'LumoNativeComposer',
    LumoNativeComposerImage = 'LumoNativeComposerImage',
    LumoNativeComposerModelSelection = 'LumoNativeComposerModelSelection',
    LumoNewMarketingLinks = 'LumoNewMarketingLinks',
    LumoProjects = 'LumoProjects',
    LumoShowNextPromptSuggestions = 'LumoShowNextPromptSuggestions',
    LumoSmoothedRendering = 'LumoSmoothedRendering',
    LumoSpecialTheme = 'LumoSpecialTheme',
    LumoSurveyFreeUsers = 'LumoSurveyFreeUsers',
    LumoSurveyGuestUsers = 'LumoSurveyGuestUsers',
    LumoSurveyPaidUsers = 'LumoSurveyPaidUsers',
    LumoVisualizationInstructions = 'LumoVisualizationInstructions',
    WhatsNewV1p2 = 'WhatsNewV1p2',
    WhatsNewV1p3 = 'WhatsNewV1p3',
    WhatsNewV2 = 'WhatsNewV2',
}

export enum MailFeatureFlag {
    ComposerAssistant = 'ComposerAssistant',
    MailMetrics = 'MailMetrics',
    MailWebListTelemetry = 'MailWebListTelemetry',
    PasswordNudge = 'PasswordNudge',
    PasswordNudgeForPaidUsers = 'PasswordNudgeForPaidUsers',
    RemoveReplyStyles = 'RemoveReplyStyles',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    // Category view flags, used to control the whole category view
    CategoryOnboardingDisableCategorize = 'CategoryOnboardingDisableCategorize',
    CategoryReportUnreadCountDisabled = 'CategoryReportUnreadCountDisabled',
    CategoryView = 'CategoryView',
    CategoryViewVariant = 'CategoryViewVariant',
    MailRecordLastUnseenIncomingMessageEventID = 'MailRecordLastUnseenIncomingMessageEventID',
    MailStoreDebugMode = 'MailStoreDebugMode',
    // Attempt to fix the unability to save/send drafts on huge accounts
    PreventEventLoopCallOnCompose = 'PreventEventLoopCallOnCompose',
    //ML R&D
    LumoInMail = 'LumoInMail',
    OneTimePasscode = 'OneTimePasscode',
    ScribeToLumo = 'ScribeToLumo',
    // reworked local search using foundation search
    ContentSearch = 'ContentSearch',
}

enum MailKillSwitchFlag {
    CategoryViewConversationPrefetchDisabled = 'CategoryViewConversationPrefetchDisabled',
    ComposerInlineImageReuploadDisabled = 'ComposerInlineImageReuploadDisabled',
    DisplayCategoriesInSidebarAgain = 'DisplayCategoriesInSidebarAgain',
    EncryptedSearchMigrationSystemDisabled = 'EncryptedSearchMigrationSystemDisabled',
    MailInfitiniteLoopRateLimiterDisabled = 'MailInfitiniteLoopRateLimiterDisabled',
    MailPostSignupOneDollarPromoDisabled = 'MailPostSignupOneDollarPromoDisabled',
    RawLinkParsingDisabled = 'RawLinkParsingDisabled',
    RetryElementsOnReconnectDisabled = 'RetryElementsOnReconnectDisabled',
}

enum MeetFeatureFlag {
    EnableAccessibilityAnnouncements = 'EnableAccessibilityAnnouncements',
    MeetAdaptiveStream = 'MeetAdaptiveStream',
    MeetAdminLowerHand = 'MeetAdminLowerHand',
    MeetAllowMLSLogExport = 'MeetAllowMLSLogExport',
    MeetAllowNewHostAssignment = 'MeetAllowNewHostAssignment',
    MeetBackgroundEffectsOnMobileBrowsers = 'MeetBackgroundEffectsOnMobileBrowsers',
    MeetBlurMulticlassPersonConfidenceBoost = 'MeetBlurMulticlassPersonConfidenceBoost',
    MeetBlurPersonConfidenceBoost = 'MeetBlurPersonConfidenceBoost',
    MeetChatMentions = 'MeetChatMentions',
    MeetChatThreads = 'MeetChatThreads',
    MeetClientMetricsLog = 'MeetClientMetricsLog',
    MeetCoreWorker = 'MeetCoreWorker',
    MeetCountdownUpsell = 'MeetCountdownUpsell',
    MeetCpuOptimizations = 'MeetCpuOptimizations',
    MeetCustomVirtualBackground = 'MeetCustomVirtualBackground',
    MeetDebugMode = 'MeetDebugMode',
    MeetDtlnPerfMonitor = 'MeetDtlnPerfMonitor',
    MeetDynacast = 'MeetDynacast',
    MeetE2eeDebugStats = 'MeetE2eeDebugStats',
    MeetE2eeDisableRecovery = 'MeetE2eeDisableRecovery',
    MeetE2eeRecoveryAggressive = 'MeetE2eeRecoveryAggressive',
    MeetEarlyAccess = 'MeetEarlyAccess',
    MeetEarlyAccessPublic = 'MeetEarlyAccessPublic',
    MeetEnableAudioMixing = 'MeetEnableAudioMixing',
    MeetEnableScreenShareAudio = 'MeetEnableScreenShareAudio',
    MeetEnableSpatialAudio = 'MeetEnableSpatialAudio',
    MeetErrorReporting = 'MeetErrorReporting',
    MeetFeedbackOnSkip = 'MeetFeedbackOnSkip',
    MeetFixedAudioContextSampleRate = 'MeetFixedAudioContextSampleRate',
    MeetForceDisableNoiseCancellationOnEdge = 'MeetForceDisableNoiseCancellationOnEdge',
    MeetH264 = 'MeetH264',
    MeetHigherBitrate = 'MeetHigherBitrate',
    MeetJoinTelemetry = 'MeetJoinTelemetry',
    MeetLiveCaptions = 'MeetLiveCaptions',
    MeetMeetingTimeout = 'MeetMeetingTimeout',
    MeetNewChatHandling = 'MeetNewChatHandling',
    MeetNewJoinFunctions = 'MeetNewJoinFunctions',
    MeetOpenLinksInDesktopApp = 'MeetOpenLinksInDesktopApp',
    MeetOpenMessageFromPreview = 'MeetOpenMessageFromPreview',
    MeetParticipantsLayouts = 'MeetParticipantsLayouts',
    MeetPastMeetings = 'MeetPastMeetings',
    MeetPromptOnTabClose = 'MeetPromptOnTabClose',
    MeetProtonCalendarDeepLink = 'MeetProtonCalendarDeepLink',
    MeetQualityTelemetry = 'MeetQualityTelemetry',
    MeetQualityTelemetryKillSwitch = 'MeetQualityTelemetryKillSwitch',
    MeetRecordingRecoveryUI = 'MeetRecordingRecoveryUI',
    MeetRecordingShowAllRecordings = 'MeetRecordingShowAllRecordings',
    MeetRecordingWebCodecs = 'MeetRecordingWebCodecs',
    MeetRemainingTime = 'MeetRemainingTime',
    MeetRemoveSentryEventLimit = 'MeetRemoveSentryEventLimit',
    MeetSaveCaptionLanguagePreference = 'MeetSaveCaptionLanguagePreference',
    MeetScheduleInAdvance = 'MeetScheduleInAdvance',
    MeetScreenShareAudioSupportedElectronVersion = 'MeetScreenShareAudioSupportedElectronVersion',
    MeetSeamlessKeyRotationEnabled = 'MeetSeamlessKeyRotationEnabled',
    MeetShowMLSLogs = 'MeetShowMLSLogs',
    MeetShowReloadTrackButton = 'MeetShowReloadTrackButton',
    MeetShowUpsellModalAfterMeeting = 'MeetShowUpsellModalAfterMeeting',
    MeetSimulcast = 'MeetSimulcast',
    MeetSoundNotificationsEnabled = 'MeetSoundNotificationsEnabled',
    MeetUnblockAudioButton = 'MeetUnblockAudioButton',
    MeetUpsell = 'MeetUpsell',
    MeetUseCachedServerTime = 'MeetUseCachedServerTime',
    MeetVirtualBackground = 'MeetVirtualBackground',
    MeetVp9 = 'MeetVp9',
    MeetWaitingRoom = 'MeetWaitingRoom',
    MeetWaitingRoomJoin = 'MeetWaitingRoomJoin',
    MeetWebClientDebug = 'MeetWebClientDebug',
    PersonalMeetingRotation = 'PersonalMeetingRotation',
}

enum PaymentsFeatureFlag {
    ApplePayCapabilities = 'ApplePayCapabilities',
    DomainVpnBiz2023 = 'DomainVpnBiz2023',
    EmailForInvoices = 'EmailForInvoices',
    EmailForInvoicesKillSwitch = 'EmailForInvoicesKillSwitch',
    EnableIdeal = 'EnableIdeal',
    GooglePay = 'GooglePay',
    NewProtonBusinessBundlePlans = 'NewProtonBusinessBundlePlans',
    PaypalKrw = 'PaypalKrw',
    PaypalRegionalCurrenciesBatch3 = 'PaypalRegionalCurrenciesBatch3',
    RegionalCurrenciesBatch3 = 'RegionalCurrenciesBatch3',
    SepaPayments = 'SepaPayments',
    SepaPaymentsB2C = 'SepaPaymentsB2C',
    Vpn2024AddonsExperiment = 'Vpn2024AddonsExperiment',
    Vpn2024SignupExperiment = 'Vpn2024SignupExperiment',
}

enum VPNFeatureFlag {
    PurchaseAttributionSurveyEnabled = 'PurchaseAttributionSurveyEnabled',
}

enum WalletFeatureFlag {
    ImportPaperWallet = 'ImportPaperWallet',
    WalletDarkMode = 'WalletDarkMode',
    WalletExportTransaction = 'WalletExportTransaction',
    WalletMessageSigner = 'WalletMessageSigner',
}

export type FeatureFlag =
    | AccountProjectFeatureFlag
    | `${ActivationFeatureFlag}`
    | `${AdminFeatureFlag}`
    | `${CalendarFeatureFlag}`
    | `${CalendarKillSwitchFlag}`
    | `${CommonFeatureFlag}`
    | `${DocsFeatureFlag}`
    | `${DriveFeatureFlag}`
    | `${LumoFeatureFlag}`
    | `${MailFeatureFlag}`
    | `${MailKillSwitchFlag}`
    | `${MeetFeatureFlag}`
    | `${PaymentsFeatureFlag}`
    | `${VPNFeatureFlag}`
    | `${WalletFeatureFlag}`;
