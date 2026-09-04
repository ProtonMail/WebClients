/**
 * Feature flag list from Unleash
 * Format should be FeatureFlagName = 'FeatureFlagName'
 */
export enum CommonFeatureFlag {
    AtkinsonHyperlegible = 'AtkinsonHyperlegible',
    ForceReload = 'ForceReload',
    ColorPerEventWeb = 'ColorPerEventWeb',
    CollectLogs = 'CollectLogs',
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
    InboxDesktopCategoryViewSettingsToggleReloadDisabled = 'InboxDesktopCategoryViewSettingsToggleReloadDisabled',
    BreachAlertsNotificationsCommon = 'BreachAlertsNotificationsCommon',
    WalletAutoSetup = 'WalletAutoSetup',
    InboxDesktopWinLinNewAppSwitcher = 'InboxDesktopWinLinNewAppSwitcher',
    DarkWebEmailNotifications = 'DarkWebEmailNotifications',
    InboxWebPostSubscriptionFlow = 'InboxWebPostSubscriptionFlow',
    NewCancellationFlowUpsell = 'NewCancellationFlowUpsell',
    GoUnlimitedOffer2025 = 'GoUnlimitedOffer2025',
    UnlimitedToDuoPermanentOffer = 'UnlimitedToDuoPermanentOffer',
    Q3Sale2026FreeToUnlimitedSecondPopup = 'Q3Sale2026FreeToUnlimitedSecondPopup',
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
    // Monthly subscriber nudge kill switches (default off; enable to hide the nudge)
    SubscriberNudgeBundleMonthlyDisabled = 'SubscriberNudgeBundleMonthlyDisabled',
    SubscriberNudgeMailMonthlyDisabled = 'SubscriberNudgeMailMonthlyDisabled',
    SubscriberNudgeDriveMonthlyDisabled = 'SubscriberNudgeDriveMonthlyDisabled',
    B2BOnboarding = 'B2BOnboarding',
    InboxBringYourOwnEmail = 'InboxBringYourOwnEmail',
    InboxBringYourOwnEmailClient = 'InboxBringYourOwnEmailClient',
    InboxBringYourOwnEmailSignup = 'InboxBringYourOwnEmailSignup',
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
    AutoAddMeetingLink = 'AutoAddMeetingLink',
    AvatarColorWeb = 'AvatarColorWeb',
    AuthenticatorSettingsEnabled = 'AuthenticatorSettingsEnabled',
    OrganizationLevelEasySwitch = 'OrganizationLevelEasySwitch',
    WebNPSModal = 'WebNPSModal',
    WebApiRateLimiter = 'WebApiRateLimiter',
    PassSimpleLoginLifetimeOffer = 'PassSimpleLoginLifetimeOffer',
    MaxContactsImport = 'MaxContactsImport',
    EventLoopInterval = 'EventLoopInterval',
    DesktopDownloadApiEnabled = 'DesktopDownloadApiEnabled',
    LogWasmLoadingDisabled = 'LogWasmLoadingDisabled',
    PasswordRemindersOrg = 'PasswordRemindersOrg',
    MeetSpotlightType = 'MeetSpotlightType',
    DisablePostSubscriptionB2BOnboarding = 'DisablePostSubscriptionB2BOnboarding',
    EasySwitchB2CForDriveWeb = 'EasySwitchB2CForDriveWeb',
    EasySwitchB2CForDriveWebNewUI = 'EasySwitchB2CForDriveWebNewUI',
}

enum AccountFlag {
    AccountSettingsUserDisableFE = 'AccountSettingsUserDisableFE',
    MailTrialOffer = 'MailTrialOffer',
    DriveTrialOffer = 'DriveTrialOffer',
    PassTrialOffer = 'PassTrialOffer',
    MaintenanceImporter = 'MaintenanceImporter',
    VisionarySignup = 'VisionarySignup',
    NewCancellationFlow = 'NewCancellationFlow',
    VpnOrganizationLogRelayGatewayCreationMultiIp = 'VpnOrganizationLogRelayGatewayCreationMultiIp',
    VpnOrganizationLogRelayGatewayUpdateMultiIp = 'VpnOrganizationLogRelayGatewayUpdateMultiIp',
    B2BNonPrivateEmailPhone = 'B2BNonPrivateEmailPhone',
    B2BDarkWebMonitoring = 'B2BDarkWebMonitoring',
    B2BAlwaysOnEnabled = 'B2BAlwaysOnEnabled',
    B2BAlwaysOnWindowsRelease = 'B2BAlwaysOnWindowsRelease',
    UserGroupsPermissionCheck = 'UserGroupsPermissionCheck',
    UserGroupsGroupOwner = 'UserGroupsGroupOwner',
    EasySwitchOutlookSelectAccountDisabled = 'EasySwitchOutlookSelectAccountDisabled',
    EduGainSSO = 'EduGainSSO',
    SharedServerFeature = 'SharedServerFeature',
    CryptoPostQuantumOptIn = 'CryptoPostQuantumOptIn',
    VPNDashboard = 'VPNDashboard',
    SsoForPbs = 'SsoForPbs',
    DataRetentionPolicy = 'DataRetentionPolicy',
    UserGroupsNoCustomDomain = 'UserGroupsNoCustomDomain',
    DriveDashboard = 'DriveDashboard',
    SocialRecoverySklDisabled = 'SocialRecoverySklDisabled',
    MembersRemote = 'MembersRemote',
    ShowLiteAppCheckoutV2 = 'ShowLiteAppCheckoutV2',
    AdminRoleMVP = 'AdminRoleMVP',
    SyncOwnerRoleClient = 'SyncOwnerRoleClient',
    VpnB2bUserActivity = 'VpnB2bUserActivity',
    MspEnabled = 'MspEnabled',
    MspCostsTableEnabled = 'MspCostsTableEnabled',
    MSPStorageOptionEnabled = 'MSPStorageOptionEnabled',
    PurchaseAttributionSurveyEnabled = 'PurchaseAttributionSurveyEnabled',
    CancellationFlowFeedbackFirst = 'CancellationFlowFeedbackFirst',
    B2BSidebarRefreshEnabled = 'B2BSidebarRefreshEnabled',
    SystemGroupFlag = 'SystemGroupFlag',
    VPNReferralWithoutTrial = 'VPNReferralWithoutTrial',
    UserGroupsScimGroups = 'UserGroupsScimGroups',
    EnableZenDeskAIAgent = 'EnableZenDeskAIAgent',
    WorldCupRetention = 'WorldCupRetention',
    DisableSsoBackupPassword = 'DisableSsoBackupPassword',
    SpacesAvailable = 'SpacesAvailable',
}

enum PaymentsFlag {
    SepaPayments = 'SepaPayments',
    SepaPaymentsB2C = 'SepaPaymentsB2C',
    NewProtonBusinessBundlePlans = 'NewProtonBusinessBundlePlans',
    GooglePay = 'GooglePay',
    RegionalCurrenciesBatch3 = 'RegionalCurrenciesBatch3',
    PaypalRegionalCurrenciesBatch3 = 'PaypalRegionalCurrenciesBatch3',
    PaypalKrw = 'PaypalKrw',
    EmailForInvoices = 'EmailForInvoices',
    EmailForInvoicesKillSwitch = 'EmailForInvoicesKillSwitch',
    DomainVpnBiz2023 = 'DomainVpnBiz2023',
    Vpn2024AddonsExperiment = 'Vpn2024AddonsExperiment',
    Vpn2024SignupExperiment = 'Vpn2024SignupExperiment',
    EnableIdeal = 'EnableIdeal',
    ApplePayCapabilities = 'ApplePayCapabilities',
}

export enum CalendarFeatureFlag {
    CalendarEventsPrefetch = 'CalendarEventsPrefetch',
    EditSingleOccurrenceWeb = 'EditSingleOccurrenceWeb',
    CalendarMetrics = 'CalendarMetrics',
    RsvpCommentWeb = 'RsvpCommentWeb',
    AutoAddDisabledE2EEAttendees = 'AutoAddDisabledE2EEAttendees',
    NGCWebAccess = 'NGCWebAccess',
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
    DriveWebReportAbuseDirectShare = 'DriveWebReportAbuseDirectShare',
    // SDK rollouts — names should match @protontech/drive-sdk FeatureFlags enum, or have a manual mapping
    DriveCryptoEncryptBlocksWithPgpAead = 'DriveCryptoEncryptBlocksWithPgpAead',
    DriveSmallFileUpload = 'DriveSmallFileUpload',
    // Spotlight
    DriveWebSharingAdminTooltip = 'DriveWebSharingAdminTooltip',
    // Lumo in Drive
    DriveWebLumo = 'DriveWebLumo',
    DriveWebLumoDestructiveActionsDisabled = 'DriveWebLumoDestructiveActionsDisabled',
}

enum DocsFeatureFlag {
    // General
    DriveDocsDisabled = 'DriveDocsDisabled',
    DownloadLogs = 'DownloadLogs',
    DocsAppSwitcher = 'DocsAppSwitcher',
    DocsPublicEditing = 'DocsPublicEditing',
    DriveWebTextFileEdit = 'DriveWebTextFileEdit',
    DocsTableOfContents = 'DocsTableOfContents',
    DocsOpenTracer = 'DocsOpenTracer',
    DocsGatePrivateInviteAccess = 'DocsGatePrivateInviteAccess',
    DocsDarkTheme = 'DocsDarkTheme',
    DocsODTEnabled = 'DocsODTEnabled',
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
    DocsSheetsEnabled = 'DocsSheetsEnabled',
    DocsSheetsDisabled = 'DocsSheetsDisabled',
    SheetsEditorEnabled = 'SheetsEditorEnabled',
    SheetsODSImportEnabled = 'SheetsODSImportEnabled',
    SheetsODSExportEnabled = 'SheetsODSExportEnabled',
    SheetsDriftDetectionEnabled = 'SheetsDriftDetectionEnabled',
    SheetsPatchesStorageEnabled = 'SheetsPatchesStorageEnabled',
    SheetsStatusBarEnabled = 'SheetsStatusBarEnabled',
    SheetsCustomNumberFormatEnabled = 'SheetsCustomNumberFormatEnabled',
    SheetsCustomDateTimeFormatEnabled = 'SheetsCustomDateTimeFormatEnabled',
    SheetsActionsStorageEnabled = 'SheetsActionsStorageEnabled',
    SheetsTablesEnabled = 'SheetsTablesEnabled',
    SheetsMountAfterInitialLoadDisabled = 'SheetsMountAfterInitialLoadDisabled',
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
    DocsLoadRecentsWithDriveSDK = 'DocsLoadRecentsWithDriveSDK',
    DocsDocumentViewerEventsSDK = 'DocsDocumentViewerEventsSDK',
    DocsRenameWithDriveSDK = 'DocsRenameWithDriveSDK',
    DocsTrashWithDriveSDK = 'DocsTrashWithDriveSDK',
    DocsMoveModalDriveSDK = 'DocsMoveModalDriveSDK',
    DocsInvitationsDriveSDK = 'DocsInvitationsDriveSDK',
    DocsDriveCompatSDK = 'DocsDriveCompatSDK',
}

export enum MailFeatureFlag {
    PasswordNudge = 'PasswordNudge',
    PasswordNudgeForPaidUsers = 'PasswordNudgeForPaidUsers',
    ComposerAssistant = 'ComposerAssistant',
    ReplayOnboardingModal = 'ReplayOnboardingModal',
    MailMetrics = 'MailMetrics',
    MailWebListTelemetry = 'MailWebListTelemetry',
    RemoveReplyStyles = 'RemoveReplyStyles',
    // Category view flags, used to control the whole category view
    CategoryView = 'CategoryView',
    MailRecordLastUnseenIncomingMessageEventID = 'MailRecordLastUnseenIncomingMessageEventID',
    CategoryViewVariant = 'CategoryViewVariant',
    CategoryReportUnreadCountDisabled = 'CategoryReportUnreadCountDisabled',
    CategoryOnboardingDisableCategorize = 'CategoryOnboardingDisableCategorize',
    // Attempt to fix the unability to save/send drafts on huge accounts
    PreventEventLoopCallOnCompose = 'PreventEventLoopCallOnCompose',
    MailStoreDebugMode = 'MailStoreDebugMode',
    //ML R&D
    LumoInMail = 'LumoInMail',
    ScribeToLumo = 'ScribeToLumo',
    OneTimePasscode = 'OneTimePasscode',
    // reworked local search using foundation search
    ContentSearch = 'ContentSearch',
}

enum MailKillSwitchFlag {
    MailPostSignupOneDollarPromoDisabled = 'MailPostSignupOneDollarPromoDisabled',
    MailInfitiniteLoopRateLimiterDisabled = 'MailInfitiniteLoopRateLimiterDisabled',
    EncryptedSearchMigrationSystemDisabled = 'EncryptedSearchMigrationSystemDisabled',
    // Refreshed toolbar UI flags
    // @deprecated – use `NewToolbarKillSwitch` instead
    RefreshedToolbarUIDisabled = 'RefreshedToolbarUIDisabled',
    NewToolbarKillSwitch = 'NewToolbarKillSwitch',
    RawLinkParsingDisabled = 'RawLinkParsingDisabled',
    CategoryViewConversationPrefetchDisabled = 'CategoryViewConversationPrefetchDisabled',
    ComposerInlineImageReuploadDisabled = 'ComposerInlineImageReuploadDisabled',
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
    MeetUpsell = 'MeetUpsell',
    MeetCountdownUpsell = 'MeetCountdownUpsell',
    MeetRemainingTime = 'MeetRemainingTime',
    PersonalMeetingRotation = 'PersonalMeetingRotation',
    MeetPromptOnTabClose = 'MeetPromptOnTabClose',
    MeetSoundNotificationsEnabled = 'MeetSoundNotificationsEnabled',
    MeetNewChatHandling = 'MeetNewChatHandling',
    MeetSeamlessKeyRotationEnabled = 'MeetSeamlessKeyRotationEnabled',
    MeetShowUpsellModalAfterMeeting = 'MeetShowUpsellModalAfterMeeting',
    MeetShowMLSLogs = 'MeetShowMLSLogs',
    MeetAllowNewHostAssignment = 'MeetAllowNewHostAssignment',
    MeetAllowMLSLogExport = 'MeetAllowMLSLogExport',
    MeetClientMetricsLog = 'MeetClientMetricsLog',
    MeetVp9 = 'MeetVp9',
    MeetHigherBitrate = 'MeetHigherBitrate',
    MeetScheduleInAdvance = 'MeetScheduleInAdvance',
    MeetProtonCalendarDeepLink = 'MeetProtonCalendarDeepLink',
    MeetUnblockAudioButton = 'MeetUnblockAudioButton',
    MeetOpenLinksInDesktopApp = 'MeetOpenLinksInDesktopApp',
    MeetDebugMode = 'MeetDebugMode',
    MeetQualityTelemetry = 'MeetQualityTelemetry',
    MeetQualityTelemetryKillSwitch = 'MeetQualityTelemetryKillSwitch',
    MeetWebClientDebug = 'MeetWebClientDebug',
    MeetE2eeDebugStats = 'MeetE2eeDebugStats',
    MeetE2eeRecoveryAggressive = 'MeetE2eeRecoveryAggressive',
    MeetFeedbackOnSkip = 'MeetFeedbackOnSkip',
    MeetPastMeetings = 'MeetPastMeetings',
    MeetE2eeDisableRecovery = 'MeetE2eeDisableRecovery',
    MeetShowReloadTrackButton = 'MeetShowReloadTrackButton',
    MeetH264 = 'MeetH264',
    MeetRecordingWebCodecs = 'MeetRecordingWebCodecs',
    MeetRecordingRecoveryUI = 'MeetRecordingRecoveryUI',
    MeetRecordingShowAllRecordings = 'MeetRecordingShowAllRecordings',
    MeetEnableAudioMixing = 'MeetEnableAudioMixing',
    MeetEnableSpatialAudio = 'MeetEnableSpatialAudio',
    MeetFixedAudioContextSampleRate = 'MeetFixedAudioContextSampleRate',
    MeetAdminLowerHand = 'MeetAdminLowerHand',
    MeetJoinTelemetry = 'MeetJoinTelemetry',
    MeetAdaptiveStream = 'MeetAdaptiveStream',
    MeetDynacast = 'MeetDynacast',
    MeetSimulcast = 'MeetSimulcast',
    MeetMeetingTimeout = 'MeetMeetingTimeout',
    MeetCoreWorker = 'MeetCoreWorker',
    MeetEnableScreenShareAudio = 'MeetEnableScreenShareAudio',
    EnableAccessibilityAnnouncements = 'EnableAccessibilityAnnouncements',
    MeetWaitingRoom = 'MeetWaitingRoom',
    MeetWaitingRoomJoin = 'MeetWaitingRoomJoin',
    MeetDtlnPerfMonitor = 'MeetDtlnPerfMonitor',
    MeetBlurPersonConfidenceBoost = 'MeetBlurPersonConfidenceBoost',
    MeetBlurMulticlassPersonConfidenceBoost = 'MeetBlurMulticlassPersonConfidenceBoost',
    MeetChatThreads = 'MeetChatThreads',
    MeetVirtualBackground = 'MeetVirtualBackground',
    MeetCustomVirtualBackground = 'MeetCustomVirtualBackground',
    MeetLiveCaptions = 'MeetLiveCaptions',
    MeetSaveCaptionLanguagePreference = 'MeetSaveCaptionLanguagePreference',
    MeetUseCachedServerTime = 'MeetUseCachedServerTime',
    MeetBackgroundEffectsOnMobileBrowsers = 'MeetBackgroundEffectsOnMobileBrowsers',
    MeetParticipantsLayouts = 'MeetParticipantsLayouts',
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
    LumoSurveyFreeUsers = 'LumoSurveyFreeUsers',
    LumoSurveyPaidUsers = 'LumoSurveyPaidUsers',
    LumoSurveyGuestUsers = 'LumoSurveyGuestUsers',
    LumoNewMarketingLinks = 'LumoNewMarketingLinks',
    LumoMeowmory = 'LumoMeowmory',
    LumoVisualizationInstructions = 'LumoVisualizationInstructions',
    LumoNativeAuthAndroid = 'LumoNativeAuthAndroid',
    LumoNativeAuthIOS = 'LumoNativeAuthIOS',
    LumoCustomAgents = 'LumoCustomAgents',
    LumoAiPaperTrail = 'LumoAiPaperTrail',
    LumoAiPaperTrailRoute = 'LumoAiPaperTrailRoute',
    LumoAiPaperTrailPopup = 'LumoAiPaperTrailPopup',
    LumoMaxAvailableGuest = 'LumoMaxAvailableGuest',
    LumoMaxAvailableFree = 'LumoMaxAvailableFree',
    LumoApertusModel = 'LumoApertusModel',
    LumoDictationV2 = 'LumoDictationV2',
    WhatsNewV2 = 'WhatsNewV2',
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
