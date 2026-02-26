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
    BookingPageLocationSpotlight = 'BookingPageLocationSpotlight',

    Offers = 'Offers',
    PrivacyDropdownOpened = 'PrivacyDropdownOpened',
    ProtonBadge = 'ProtonBadge',
    SpotlightVPNDrawer = 'SpotlightVPNDrawer',
    ReferralExplanationOpened = 'ReferralExplanationOpened',
    ReferralProgram = 'ReferralProgram', // Legacy referral program
    ReferralProgramSpotlight = 'ReferralProgramSpotlight', // Legacy referral program
    ReferralSpotlightSettings = 'ReferralSpotlightSettings',
    ReferralTopBarButton = 'ReferralTopBarButton',
    ReferralDrawerApp = 'ReferralDrawerApp',
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

    // Lumo
    LumoSmoothedRendering = 'LumoSmoothedRendering',

    // NPS
    NPSFeedbackDesktopCalendar = 'NPSFeedbackDesktopCalendar',
    NPSFeedbackDesktopMail = 'NPSFeedbackDesktopMail',
    NPSFeedbackWebCalendar = 'NPSFeedbackWebCalendar',
    NPSFeedbackWebMail = 'NPSFeedbackWebMail',

    // Spring sale 2026
    // Mail
    OfferMar26MailPlus = `OfferMar26MailPlus`,
    OfferMar26MailPlusToYearly = `OfferMar26MailPlusToYearly`,
    OfferMar26MailPlusRetention = `OfferMar26MailPlusRetention`,
    // VPN
    OfferMar26VpnPlus = `OfferMar26VpnPlus`,
    OfferMar26VpnPlusToYearly = `OfferMar26VpnPlusToYearly`,
    OfferMar26VpnPlusRetention = `OfferMar26VpnPlusRetention`,
    // Drive
    OfferMar26DrivePlus = `OfferMar26DrivePlus`,
    OfferMar26DrivePlusRetention = `OfferMar26DrivePlusRetention`,
    // Pass
    OfferMar26PassPlus = `OfferMar26PassPlus`,
    OfferMar26PassPlusRetention = `OfferMar26PassPlusRetention`,
    // Unlimited
    OfferMar26UnlimitedFromVpnPlus = `OfferMar26UnlimitedFromVpnPlus`,
    OfferMar26UnlimitedFromMailPlus = `OfferMar26UnlimitedFromMailPlus`,
    OfferMar26UnlimitedFromDrivePlus = `OfferMar26UnlimitedFromDrivePlus`,
    OfferMar26UnlimitedFromPassPlus = `OfferMar26UnlimitedFromPassPlus`,
    OfferMar26UnlimitedRetention = `OfferMar26UnlimitedRetention`,
    // Multi-user
    OfferMar26Duo = `OfferMar26Duo`,
    OfferMar26Family = `OfferMar26Family`,
}
