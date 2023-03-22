import { createContext } from 'react';

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
    EarlyAccessScope = 'EarlyAccess',
    WelcomeImportModalShown = 'WelcomeImportModalShown',
    BlackFridayPromoShown = 'BlackFridayPromoShown',
    BundlePromoShown = 'BundlePromoShown',
    UsedMailMobileApp = 'UsedMailMobileApp',
    UsedContactsImport = 'UsedContactsImport',
    SpotlightEncryptedSearch = 'SpotlightEncryptedSearch',
    CalendarSubscription = 'CalendarSubscription',
    MailFeedbackEnabled = 'MailFeedbackEnabled',
    CalendarFeedbackEnabled = 'CalendarFeedbackEnabled',
    SpotlightScheduledSend = 'SpotlightScheduledSend',
    CalendarInviteLocale = 'CalendarInviteLocale',
    CalendarAutoImportInvite = 'CalendarAutoImportInvite',
    CalendarNotificationsRevampAvailable = 'CalendarNotificationsRevampAvailable',
    CalendarPersonalEventsDeprecated = 'CalendarPersonalEventsDeprecated',
    CalendarSharingEnabled = 'CalendarSharingEnabled',
    SpyTrackerProtection = 'SpyTrackerProtection',
    SpyTrackerProtectionIncorporator = 'SpyTrackerProtectionIncorporator',
    SpotlightGetStartedChecklist = 'SpotlightGetStartedChecklist',
    SpotlightLoadContent = 'SpotlightLoadContent',
    NumAttachmentsWithoutEmbedded = 'NumAttachmentsWithoutEmbedded',
    DarkStylesInBody = 'DarkStylesInBody',
    EasySwitch = 'EasySwitch',
    DismissedRecoverDataCard = 'DismissedRecoverDataCard',
    ReferralProgram = 'ReferralProgram',
    ReferralProgramSpotlight = 'ReferralProgramSpotlight',
    SeenReferralModal = 'SeenReferralModal',
    ReferralExplanationOpened = 'ReferralExplanationOpened',
    PaymentsDisabled = 'PaymentsDisabled',
    DriveSearchSpotlight = 'DriveSearchSpotlight',
    MailServiceWorker = 'MailServiceWorker',
    SetExpiration = 'SetExpiration',
    SpotlightDrawer = 'SpotlightDrawer',
    RebrandingFeedbackEnabled = 'RebrandingFeedbackEnabled',
    RebrandingFeedback = 'RebrandingFeedback',
    DrivePlan = 'DrivePlan',
    NumberOfPreloadedConversations = 'NumberOfPreloadedConversations',
    SLIntegration = 'SLIntegration',
    BlockSenderInToolbar = 'BlockSenderInToolbar',
    SpotlightAutoAddedInvites = 'SpotlightAutoAddedInvites',
    Offers = 'Offers',
    OfferGoUnlimited2022 = 'OfferGoUnlimited2022',
    OfferSpecialOffer2022 = 'OfferSpecialOffer2022',
    OfferBlackFridayMailFree2022 = 'OfferBlackFridayMailFree2022',
    OfferBlackFridayMail2022 = 'OfferBlackFridayMail2022',
    OfferBlackFridayMailPro2022 = 'OfferBlackFridayMailPro2022',
    OfferBlackFridayVPN1Deal2022 = 'OfferBlackFridayVPN1Deal2022',
    OfferBlackFridayVPN2Deal2022 = 'OfferBlackFridayVPN2Deal2022',
    OfferBlackFridayVPN3Deal2022 = 'OfferBlackFridayVPN3Deal2022',
    OfferMailTrial2023 = 'OfferMailTrial2023',
    SmtpToken = 'SmtpToken',
    TrustedDeviceRecovery = 'TrustedDeviceRecovery',
    DriveMyDevices = 'DriveWebMyDevices',
    LegacyMessageMigrationEnabled = 'LegacyMessageMigrationEnabled',
    ProtonBadge = 'ProtonBadge',
    QuickReply = 'QuickReply',
    ScheduledSendFreemium = 'ScheduledSendFreemium',
    KeyTransparencyWEB = 'KeyTransparencyWEB',
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

export const FeaturesContext = createContext<FeaturesContextValue>({} as FeaturesContextValue);

export const FeaturesLoadContext = createContext<FeaturesLoadContextValue>(null as unknown as FeaturesLoadContextValue);
