export type FeatureType = 'boolean' | 'integer' | 'float' | 'string' | 'enumeration' | 'mixed';

export interface Feature<V = any> {
    Code: string;
    Type: FeatureType;
    DefaultValue: V;
    Value: V;
    Options?: string[];
    Minimum: number;
    Maximum: number;
    Global: boolean;
    Writable: boolean;
    ExpirationTime: number;
    UpdateTime: number;
}

export enum FeatureCode {
    /*
     * In the past whether you have a certain early-access (e.g. alpha / beta)
     * enabled or not was purely based on a client-side cookie and this feature's
     * value was to indicate not what your env was but rather what options were
     * available to you (whether you had access to both alpha & beta or only to beta).
     *
     * However, now we are persisting the users preference on the backed on their
     * settings under the same name "EarlyAccess" (either 0 or 1).
     *
     * To avoid confusing these two this has been renamed to "EarlyAccessScope".
     * Ideally we would rename it to that on the server as well (and when that happens
     * we can remove this comment :)).
     */
    AccountSecurityDismissed2FACard = 'AccountSecurityDismissed2FACard',
    AliasPromotion = 'AliasPromotion',
    AlmostAllMail = 'AlmostAllMail',
    AutoAddHolidaysCalendars = 'AutoAddHolidaysCalendars',
    AutoDelete = 'AutoDelete',
    AutoDowngradeReminder = 'AutoDowngradeReminder',
    BlackFridayPromoShown = 'BlackFridayPromoShown',
    BlockSenderInToolbar = 'BlockSenderInToolbar',
    BundlePromoShown = 'BundlePromoShown',
    CollapsibleSidebarSpotlightMail = 'CollapsibleSidebarSpotlightMail',
    CollapsibleSidebarSpotlightCalendar = 'CollapsibleSidebarSpotlightCalendar',
    CalendarBusySlotsSpotlight = 'CalendarBusySlotsSpotlight',
    CalendarFeedbackEnabled = 'CalendarFeedbackEnabled',
    CalendarEncryptedSearch = 'CalendarEncryptedSearch',
    CalendarEventColorSpotlight = 'CalendarEventColorSpotlight',
    CalendarVideoConferenceSpotlight = 'CalendarVideoConferenceSpotlight',
    CleanUTMTrackers = 'CleanUTMTrackers',
    ComposerAssistantSpotlight = 'ComposerAssistantSpotlight',
    ComposerAssistantInitialSetup = 'ComposerAssistantInitialSetup',
    ComposerAssistantTrialStartDate = 'ComposerAssistantTrialStartDate',
    DarkStylesInBody = 'DarkStylesInBody',
    DismissedRecoverDataCard = 'DismissedRecoverDataCard',
    DriveMyDevices = 'DriveWebMyDevices',
    DrivePlan = 'DrivePlan',
    DriveSearchSpotlight = 'DriveSearchSpotlight',
    ESAutomaticBackgroundIndexing = 'ESAutomaticBackgroundIndexing',
    ESUserInterface = 'ESUserInterface',
    EarlyAccessScope = 'EarlyAccess',
    EasySwitch = 'EasySwitch',
    ElectronESInboxThreshold = 'ElectronESInboxThreshold',
    ElectronConvPreloadAmount = 'ElectronConvPreloadAmount',
    InboxDesktopFreeTrialDates = 'InboxDesktopFreeTrialDates',
    InboxDesktopFreeTrialReminders = 'InboxDesktopFreeTrialReminders',
    MailActionsChunkSize = 'MailActionsChunkSize',
    MailFeedbackEnabled = 'MailFeedbackEnabled',
    MailServiceWorker = 'MailServiceWorker',
    NumAttachmentsWithoutEmbedded = 'NumAttachmentsWithoutEmbedded',
    NumberOfPreloadedConversations = 'NumberOfPreloadedConversations',
    // This is a different offer than the others, it runs all the time and is used to nudge free users once their accounts is old enough
    OfferSubscriptionReminder = 'OfferSubscriptionReminder',
    OfferDuoPlanYearly2024 = 'OfferDuoPlanYearly2024',
    OfferDuoPlanTwoYears2024 = 'OfferDuoPlanTwoYears2024',
    OfferFamily2023 = 'OfferFamily2023',
    OfferGoUnlimited2022 = 'OfferGoUnlimited2022',
    OfferMailTrial2023 = 'OfferMailTrial2023',
    OfferMailTrial2024 = 'OfferMailTrial2024',
    OfferSpecialOffer2022 = 'OfferSpecialOffer2022',
    OfferSummer2023 = 'OfferSummer2023',

    OfferPassFamilyPlan2024Yearly = 'OfferPassFamilyPlan2024Yearly',

    OfferBlackFriday2024InboxFree = 'OfferBlackFriday2024InboxFree',
    OfferBlackFriday2024PassFree = 'OfferBlackFriday2024PassFree',
    OfferBlackFriday2024PassPlus = 'OfferBlackFriday2024PassPlus',
    OfferBlackFriday2024DriveFree = 'OfferBlackFriday2024DriveFree',
    OfferBlackFriday2024VPNFree = 'OfferBlackFriday2024VPNFree',
    OfferBlackFriday2024InboxFreeYearly = 'OfferBlackFriday2024InboxFreeYearly',
    OfferBlackFriday2024DriveFreeYearly = 'OfferBlackFriday2024DriveFreeYearly',
    OfferBlackFriday2024VPNFreeYearly = 'OfferBlackFriday2024VPNFreeYearly',
    OfferBlackFriday2024Plus = 'OfferBlackFriday2024Plus',
    OfferBlackFriday2024VPNMonthly = 'OfferBlackFriday2024VPNMonthly',
    OfferBlackFriday2024Unlimited = 'OfferBlackFriday2024Unlimited',
    OfferBlackFriday2024Duo = 'OfferBlackFriday2024Duo',

    Offers = 'Offers',
    OrgSpamBlockList = 'OrgSpamBlockList',
    OrgTwoFactor = 'OrgTwoFactor',
    PaymentsDisabled = 'PaymentsDisabled',
    PrivacyDropdownOpened = 'PrivacyDropdownOpened',
    ProtonBadge = 'ProtonBadge',
    ProtonSentinel = 'ProtonSentinel',
    ProtonSentinelUpsell = 'ProtonSentinelUpsell',
    QuickReply = 'QuickReply',
    QuickSettingsSpotlight = 'QuickSettingsSpotlight',
    RebrandingFeedback = 'RebrandingFeedback',
    RebrandingFeedbackEnabled = 'RebrandingFeedbackEnabled',
    ReferralExplanationOpened = 'ReferralExplanationOpened',
    ReferralProgram = 'ReferralProgram',
    ReferralProgramSpotlight = 'ReferralProgramSpotlight',
    SLIntegration = 'SLIntegration',
    ScheduledSendFreemium = 'ScheduledSendFreemium',
    SeenReferralModal = 'SeenReferralModal',
    SetExpiration = 'SetExpiration',
    SmtpToken = 'SmtpToken',
    SpotlightBreachAlertSecurityCenter = 'SpotlightBreachAlertSecurityCenter',
    SpotlightGetStartedChecklist = 'SpotlightGetStartedChecklist',
    SpotlightLoadContent = 'SpotlightLoadContent',
    SpotlightScheduledSend = 'SpotlightScheduledSend',
    SpyTrackerProtectionIncorporator = 'SpyTrackerProtectionIncorporator',
    SubscriptionLastReminderDate = 'SubscriptionLastReminderDate',
    UnreadFavicon = 'UnreadFavicon',
    UsedContactsImport = 'UsedContactsImport',
    UsedMailMobileApp = 'UsedMailMobileApp',
    WelcomeImportModalShown = 'WelcomeImportModalShown',
    PassOnboardingSpotlights = 'PassOnboardingSpotlights',
    ProtonTipsSnoozeTime = 'ProtonTipsSnoozeTime',
    SeenLightLabellingFeatureModal = 'SeenLightLabellingFeatureModal',
}
