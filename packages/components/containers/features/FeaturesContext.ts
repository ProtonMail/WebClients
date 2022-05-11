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
    ScheduledSend = 'ScheduledSend',
    SpotlightScheduledSend = 'SpotlightScheduledSend',
    ExternalSignup = 'ExternalSignup',
    CalendarInviteLocale = 'CalendarInviteLocale',
    CalendarAutoImportInvite = 'CalendarAutoImportInvite',
    CalendarSharingEnabled = 'CalendarSharingEnabled',
    SeenMnemonicPrompt = 'SeenMnemonicPrompt',
    SpyTrackerProtection = 'SpyTrackerProtection',
    SpyTrackerProtectionIncorporator = 'SpyTrackerProtectionIncorporator',
    SpotlightSpyTrackerProtection = 'SpotlightSpyTrackerProtection',
    SpotlightGetStartedChecklist = 'SpotlightGetStartedChecklist',
    NumAttachmentsWithoutEmbedded = 'NumAttachmentsWithoutEmbedded',
    DarkStylesInBody = 'DarkStylesInBody',
    EasySwitch = 'EasySwitch',
    SpotlightDiscoverProtonServices = 'SpotlightDiscoverProtonServices',
    DismissedRecoverDataCard = 'DismissedRecoverDataCard',
    ReferralProgram = 'ReferralProgram',
    ReferralProgramSpotlight = 'ReferralProgramSpotlight',
    SeenReferralModal = 'SeenReferralModal',
    ReferralExplanationOpened = 'ReferralExplanationOpened',
    SpotlightEmailNotifications = 'SpotlightEmailNotifications',
    PaymentsDisabled = 'PaymentsDisabled',
    DriveSearchSpotlight = 'DriveSearchSpotlight',
    MailServiceWorker = 'MailServiceWorker',
    SeenV5WelcomeModal = 'SeenV5WelcomeModal',
    MailContextMenu = 'MailContextMenu',
    NudgeProton = 'NudgeProton',
    EORedesign = 'EORedesign',
    CalendarViewInMail = 'CalendarViewInMail',
    RebrandingFeedbackEnabled = 'RebrandingFeedbackEnabled',
    RebrandingFeedback = 'RebrandingFeedback',
    SubscribedCalendarReminder = 'SubscribedCalendarReminder',
    SpotlightSubscribedCalendarReminder = 'SpotlightSubscribedCalendarReminder',
    DrivePlan = 'DrivePlan',
    TopBannerDisplayDriveRelease = 'TopBannerDisplayDriveRelease',
    TopBannerVisitedDriveRelease = 'TopBannerVisitedDriveRelease',
    ApplyFilters = 'ApplyFilters',
    NumberOfPreloadedConversations = 'NumberOfPreloadedConversations',
    SLIntegration = 'SLIntegration',
    BlockSender = 'BlockSender',
    SpotlightAutoAddedInvites = 'SpotlightAutoAddedInvites',
    ContextFiltering = 'ContextFiltering',
    EasySwitchGmailNewScope = 'EasySwitchGmailNewScope',
    TrustedDeviceRecovery = 'TrustedDeviceRecovery',
    BulkUserUpload = 'BulkUserUpload',
    DriveBeta = 'DriveBeta',
    PartialEncryptedSearch = 'PartialEncryptedSearch',
    ConversationHeaderInScroll = 'ConversationHeaderInScroll',
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
}

export const FeaturesContext = createContext<FeaturesContextValue>({} as FeaturesContextValue);

export const FeaturesLoadContext = createContext<FeaturesLoadContextValue>(null as unknown as FeaturesLoadContextValue);
