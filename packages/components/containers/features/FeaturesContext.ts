import { createContext } from 'react';

import noop from '@proton/utils/noop';

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
    AliasPromotion = 'AliasPromotion',
    AlmostAllMail = 'AlmostAllMail',
    AlmostAllMailSpotlight = 'AlmostAllMailSpotlight',
    AutoAddHolidaysCalendars = 'AutoAddHolidaysCalendars',
    AutoDelete = 'AutoDelete',
    BlackFridayPromoShown = 'BlackFridayPromoShown',
    BlockSenderInToolbar = 'BlockSenderInToolbar',
    BundlePromoShown = 'BundlePromoShown',
    CalendarFeedbackEnabled = 'CalendarFeedbackEnabled',
    CalendarFetchMetadataOnly = 'CalendarFetchMetadataOnly',
    CalendarEncryptedSearch = 'CalendarEncryptedSearch',
    CalendarEncryptedSearchSpotlight = 'CalendarEncryptedSearchSpotlight',
    CalendarSharingEnabled = 'CalendarSharingEnabled',
    CalendarSharingSpotlight = 'CalendarSharingSpotlight',
    CleanUTMTrackers = 'CleanUTMTrackers',
    DarkStylesInBody = 'DarkStylesInBody',
    DismissedRecoverDataCard = 'DismissedRecoverDataCard',
    DriveMyDevices = 'DriveWebMyDevices',
    DrivePlan = 'DrivePlan',
    DriveSearchSpotlight = 'DriveSearchSpotlight',
    DriveWindowsGAMailSpotlight = 'DriveWindowsGAMailSpotlight',
    DriveWindowsGAMailSpotlightShown = 'DriveWindowsGAMailSpotlightShown',
    ESAutomaticBackgroundIndexing = 'ESAutomaticBackgroundIndexing',
    ESUserInterface = 'ESUserInterface',
    EarlyAccessScope = 'EarlyAccess',
    EasySwitch = 'EasySwitch',
    EmailForwardingSpotlight = 'EmailForwardingSpotlight',
    HolidaysCalendars = 'HolidaysCalendars',
    HolidaysCalendarsSpotlight = 'HolidaysCalendarsSpotlight',
    KeyTransparencyAccount = 'KeyTransparencyWebAccount',
    KeyTransparencyCalendar = 'KeyTransparencyWebCalendar',
    KeyTransparencyDrive = 'KeyTransparencyWebDrive',
    KeyTransparencyMail = 'KeyTransparencyWebMail',
    LegacyMessageMigrationEnabled = 'LegacyMessageMigrationEnabled',
    MailDisableE2EE = 'MailDisableE2EE',
    MailFeedbackEnabled = 'MailFeedbackEnabled',
    MailServiceWorker = 'MailServiceWorker',
    NumAttachmentsWithoutEmbedded = 'NumAttachmentsWithoutEmbedded',
    NumberOfPreloadedConversations = 'NumberOfPreloadedConversations',
    OfferBlackFridayMail2022 = 'OfferBlackFridayMail2022',
    OfferBlackFridayMailFree2022 = 'OfferBlackFridayMailFree2022',
    OfferBlackFridayMailPro2022 = 'OfferBlackFridayMailPro2022',
    OfferBlackFridayVPN1Deal2022 = 'OfferBlackFridayVPN1Deal2022',
    OfferBlackFridayVPN2Deal2022 = 'OfferBlackFridayVPN2Deal2022',
    OfferBlackFridayVPN3Deal2022 = 'OfferBlackFridayVPN3Deal2022',
    OfferFamily2023 = 'OfferFamily2023',
    OfferGoUnlimited2022 = 'OfferGoUnlimited2022',
    OfferMailTrial2023 = 'OfferMailTrial2023',
    OfferSpecialOffer2022 = 'OfferSpecialOffer2022',
    OfferSummer2023 = 'OfferSummer2023',
    OfferBlackFriday2023InboxFree = 'OfferBlackFriday2023InboxFree',
    OfferBlackFriday2023InboxMail = 'OfferBlackFriday2023InboxMail',
    OfferBlackFriday2023InboxUnlimited = 'OfferBlackFriday2023InboxUnlimited',
    OfferBlackFriday2023VPNFree = 'OfferBlackFriday2023VPNFree',
    OfferBlackFriday2023VPNMonthly = 'OfferBlackFriday2023VPNMonthly',
    OfferBlackFriday2023VPNYearly = 'OfferBlackFriday2023VPNYearly',
    OfferBlackFriday2023VPNTwoYears = 'OfferBlackFriday2023VPNTwoYears',
    OfferBlackFriday2023DriveFree = 'OfferBlackFriday2023DriveFree',
    OfferBlackFriday2023DrivePlus = 'OfferBlackFriday2023DrivePlus',
    OfferBlackFriday2023DriveUnlimited = 'OfferBlackFriday2023DriveUnlimited',
    Offers = 'Offers',
    OrgSpamBlockList = 'OrgSpamBlockList',
    OrgTwoFactor = 'OrgTwoFactor',
    PassSignup = 'PassSignup',
    PaymentsDisabled = 'PaymentsDisabled',
    PrivacyDropdownOpened = 'PrivacyDropdownOpened',
    ProtonBadge = 'ProtonBadge',
    ProtonSentinel = 'ProtonSentinel',
    ProtonSentinelAuthLogUpsell = 'ProtonSentinelAuthLogUpsell',
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
    SpotlightEncryptedSearch = 'SpotlightEncryptedSearch',
    SpotlightGetStartedChecklist = 'SpotlightGetStartedChecklist',
    SpotlightLoadContent = 'SpotlightLoadContent',
    SpotlightScheduledSend = 'SpotlightScheduledSend',
    SpyTrackerProtectionIncorporator = 'SpyTrackerProtectionIncorporator',
    TrustedDeviceRecovery = 'TrustedDeviceRecovery',
    UnreadFavicon = 'UnreadFavicon',
    UsedContactsImport = 'UsedContactsImport',
    UsedMailMobileApp = 'UsedMailMobileApp',
    WelcomeImportModalShown = 'WelcomeImportModalShown',
}

export interface FeaturesContextValue {
    features: { [code in FeatureCode]?: Feature | undefined };
    loading: { [code in FeatureCode]?: boolean | undefined };
    enqueue: (code: FeatureCode[]) => void;
    get: <V = any>(code: FeatureCode[]) => Promise<Feature<V>[]>;
    put: <V = any>(code: FeatureCode, value: V) => Promise<Feature<V>>;
}

export type FeaturesLoadContextValue = Pick<FeaturesContextValue, 'get'>['get'];

export interface FeatureContextValue<V = any> {
    feature: Feature<V> | undefined;
    loading: boolean | undefined;
    get: () => Promise<Feature<V>>;
    update: (value: V) => Promise<Feature<V>>;
    code: FeatureCode;
}

export const FeaturesContext = createContext<FeaturesContextValue>({
    features: {},
    loading: {},
    enqueue: noop,
    get: async (): Promise<any> => null,
    put: async (): Promise<any> => null,
});

export const FeaturesLoadContext = createContext<FeaturesLoadContextValue>(null as unknown as FeaturesLoadContextValue);
