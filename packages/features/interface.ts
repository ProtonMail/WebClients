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
    BlockSenderInToolbar = 'BlockSenderInToolbar',
    BundlePromoShown = 'BundlePromoShown',
    CalendarEncryptedSearch = 'CalendarEncryptedSearch',
    CalendarEventColorSpotlight = 'CalendarEventColorSpotlight',
    CalendarVideoConferenceSpotlight = 'CalendarVideoConferenceSpotlight',
    CalendarRsvpNoteSpotlight = 'CalendarRsvpNoteSpotlight',
    ComposerAssistantSpotlight = 'ComposerAssistantSpotlight',
    ComposerAssistantInitialSetup = 'ComposerAssistantInitialSetup',
    ComposerAssistantTrialStartDate = 'ComposerAssistantTrialStartDate',
    DismissedRecoverDataCard = 'DismissedRecoverDataCard',
    DriveSearchSpotlight = 'DriveSearchSpotlight',
    DriveSpotlightInMail = 'DriveSpotlightInMail',
    EarlyAccessScope = 'EarlyAccess',
    EasySwitch = 'EasySwitch',
    ElectronESInboxThreshold = 'ElectronESInboxThreshold',
    ElectronConvPreloadAmount = 'ElectronConvPreloadAmount',
    InboxDesktopFreeTrialDates = 'InboxDesktopFreeTrialDates',
    InboxDesktopFreeTrialReminders = 'InboxDesktopFreeTrialReminders',
    MailActionsChunkSize = 'MailActionsChunkSize',
    NumAttachmentsWithoutEmbedded = 'NumAttachmentsWithoutEmbedded',
    NumberOfPreloadedConversations = 'NumberOfPreloadedConversations',
    PassNudgeDontShowAgain = 'PassNudgeDontShowAgain',
    ShowReferralTrialEndedBanner = 'ShowReferralTrialEndedBanner',
    ShowReferralTrialWillEndBanner = 'ShowReferralTrialWillEndBanner',

    // Flags needed by the one-dollar post-signup promo
    SubscriptionLastReminderDate = 'SubscriptionLastReminderDate',
    MailPostSignupOneDollarState = 'MailPostSignupOneDollarState',
    DrivePostSignupOneDollarState = 'DrivePostSignupOneDollarState',

    // Flags needed by the b2b onboarding
    B2BOnboardingSpotlight = 'B2BOnboardingSpotlight',
    ShowB2BOnboardingButton = 'ShowB2BOnboardingButton',

    // Flags needed by the monthly subscribers nudge
    MailPaidUserNudgeTimestamp = 'MailPaidUserNudgeTimestamp',
    DrivePaidUserNudgeTimestamp = 'DrivePaidUserNudgeTimestamp',
    BundlePaidUserNudgeTimestamp = 'BundlePaidUserNudgeTimestamp',

    // Flags for the newsletter subscription view
    NewsletterSubscriptionViewOnboarding = 'NewsletterSubscriptionViewOnboarding',
    NewsletterSubscriptionSpotlight = 'NewsletterSubscriptionSpotlight',

    // Flags for the category views
    CategoryViewBadgeSpotlight = 'CategoryViewBadgeSpotlight',
    CategoryViewEditReminderSpotlight = 'CategoryViewEditReminderSpotlight',
    CategoryViewB2COnboardingViewFlags = 'CategoryViewB2COnboardingViewFlags',
    CategoryViewB2BOnboardingViewFlags = 'CategoryViewB2BOnboardingViewFlags',
    CategoryViewOnboardingAccountDateThreshold = 'CategoryViewOnboardingAccountDateThreshold',

    OfferPassFamilyPlan2024Yearly = 'OfferPassFamilyPlan2024Yearly',
    OfferGoUnlimited2022 = 'OfferGoUnlimited2022',
    OfferMailTrial2023 = 'OfferMailTrial2023',

    // Bookings spotlights
    SpotlightIntroduceBookings = 'SpotlightIntroduceBookings',

    // Black Friday 2025
    OfferBlackFriday2025InboxFreeYearly = 'OfferBlackFriday2025InboxFreeYearly',
    OfferBlackFriday2025InboxFreeMonthly = 'OfferBlackFriday2025InboxFreeMonthly',
    OfferBlackFriday2025InboxPlusMonthly = 'OfferBlackFriday2025InboxPlusMonthly',
    OfferBlackFriday2025InboxPlusYearly = 'OfferBlackFriday2025InboxPlusYearly',
    OfferBlackFriday2025InboxPlusYearlyExperiment = 'OfferBlackFriday2025InboxPlusYearlyExperiment',
    OfferBlackFriday2025InboxPlusYearlyExperiment2 = 'OfferBlackFriday2025InboxPlusYearlyExperiment2',
    OfferBlackFriday2025Unlimited = 'OfferBlackFriday2025Unlimited',
    OfferBlackFriday2025Duo = 'OfferBlackFriday2025Duo',
    OfferBlackFriday2025FamilyMonthly = 'OfferBlackFriday2025FamilyMonthly',

    BlackFridayWave2InboxExperiment = 'BlackFridayWave2InboxExperiment',
    BlackFridayWave2VPNExperiment = 'BlackFridayWave2VPNExperiment',

    OfferBlackFriday2025VPNFreeYearly = 'OfferBlackFriday2025VPNFreeYearly',
    OfferBlackFriday2025VPNFreeMonthly = 'OfferBlackFriday2025VPNFreeMonthly',
    OfferBlackFriday2025VPNPlusMonthly = 'OfferBlackFriday2025VPNPlusMonthly',
    OfferBlackFriday2025VPNPlusMonthly2 = 'OfferBlackFriday2025VPNPlusMonthly2',
    OfferBlackFriday2025VPNPlusYearly = 'OfferBlackFriday2025VPNPlusYearly',
    OfferBlackFriday2025VPNPlusYearlyExperiment = 'OfferBlackFriday2025VPNPlusYearlyExperiment',
    OfferBlackFriday2025VPNPlusYearlyExperiment2 = 'OfferBlackFriday2025VPNPlusYearlyExperiment2',
    OfferBlackFriday2025VPNPlusTwoYear = 'OfferBlackFriday2025VPNPlusTwoYear',

    OfferBlackFriday2025DriveFreeYearly = 'OfferBlackFriday2025DriveFreeYearly',
    OfferBlackFriday2025DriveFreeMonthly = 'OfferBlackFriday2025DriveFreeMonthly',
    OfferBlackFriday2025DrivePlusMonthly = 'OfferBlackFriday2025DrivePlusMonthly',
    OfferBlackFriday2025DrivePlusYearly = 'OfferBlackFriday2025DrivePlusYearly',

    OfferBlackFriday2025PassFreeYearly = 'OfferBlackFriday2025PassFreeYearly',
    OfferBlackFriday2025PassFreeMonthly = 'OfferBlackFriday2025PassFreeMonthly',
    OfferBlackFriday2025PassPlusMonthly = 'OfferBlackFriday2025PassPlusMonthly',
    OfferBlackFriday2025PassPlusMonthly2 = 'OfferBlackFriday2025PassPlusMonthly2',
    OfferBlackFriday2025PassPlusYearly = 'OfferBlackFriday2025PassPlusYearly',

    OfferBlackFriday2025LumoFreeYearly = 'OfferBlackFriday2025LumoFreeYearly',
    OfferBlackFriday2025LumoPlusMonthly = 'OfferBlackFriday2025LumoPlusMonthly',

    Offers = 'Offers',
    PrivacyDropdownOpened = 'PrivacyDropdownOpened',
    ProtonBadge = 'ProtonBadge',
    SpotlightVPNDrawer = 'SpotlightVPNDrawer',
    ReferralExplanationOpened = 'ReferralExplanationOpened',
    ReferralProgram = 'ReferralProgram', // Legacy referral program
    ReferralProgramSpotlight = 'ReferralProgramSpotlight', // Legacy referral program
    ReferralSpotlightSettings = 'ReferralSpotlightSettings',
    ReferralTopBarButton = 'ReferralTopBarButton',
    ScheduledSendFreemium = 'ScheduledSendFreemium',
    SetExpiration = 'SetExpiration',
    SpotlightBreachAlertSecurityCenter = 'SpotlightBreachAlertSecurityCenter',
    SpotlightLoadContent = 'SpotlightLoadContent',
    SpotlightScheduledSend = 'SpotlightScheduledSend',
    SpyTrackerProtectionIncorporator = 'SpyTrackerProtectionIncorporator',
    UsedContactsImport = 'UsedContactsImport',
    PassOnboardingSpotlights = 'PassOnboardingSpotlights',
    ProtonTipsSnoozeTime = 'ProtonTipsSnoozeTime',
    SeenLightLabellingFeatureModal = 'SeenLightLabellingFeatureModal',
    PostSubscriptionShortDomainSpotlight = 'PostSubscriptionShortDomainSpotlight',
    FeatureTourExpirationDate = 'FeatureTourExpirationDate',
    FeatureTourDrawerSpotlightDisplayDate = 'FeatureTourDrawerSpotlightDisplayDate',

    // Go unlimited 2025
    OfferGoUnlimited2025 = 'OfferGoUnlimited2025',
    OfferUnlimitedRotationState = 'OfferUnlimitedRotationState',

    // Unlimited to Duo permanent offer
    HideUnlimitedToDuoPermanentOffer = 'HideUnlimitedToDuoPermanentOffer',
    UnlimitedToDuoRotationState = 'UnlimitedToDuoRotationState',

    // Meet
    NewScheduleOptionSpotlight = 'NewScheduleOptionSpotlight',

    // BYOE
    BYOESpotlightModal = 'BYOESpotlightModal',
}
