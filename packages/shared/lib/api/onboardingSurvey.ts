export const JOIN_REASONS = [
    'leave_big_tech',
    'private_secure',
    'no_ads_or_spam',
    'other_proton_products',
    'new_address',
    'other',
] as const;

export const HEARD_FROM = [
    'friend_family_colleague',
    'search_engine_app_store',
    'social_media_forum',
    'review_article',
    'youtube_podcast_creator',
    'online_ad',
    'ai_tools',
    'other',
] as const;

export const PLANNED_USE = [
    'main_email',
    'signups_accounts',
    'private_sensitive_mail',
    'exploring',
    'first_email',
    'work_business',
    'other',
] as const;

export const PREVIOUS_PROVIDERS = [
    'gmail',
    'outlook',
    'icloud',
    'yahoo',
    'other_private_service',
    'none',
    'other',
] as const;

export type Variant = 'T1' | 'T2' | 'T3' | 'T4';
export type HeardFrom = (typeof HEARD_FROM)[number];
export type PlannedUse = (typeof PLANNED_USE)[number];
export type JoinReason = (typeof JOIN_REASONS)[number];
export type PreviousProvider = (typeof PREVIOUS_PROVIDERS)[number];

export interface OnboardingSurveyPayload {
    Variant: Variant;
    HeardFrom?: HeardFrom;
    /** Free text sent to the backend unencrypted. */
    HeardFromDetail?: string;
    PlannedUse?: PlannedUse;
    /** Free text sent to the backend unencrypted. */
    PlannedUseDetail?: string;
    JoinReasons?: JoinReason[];
    /** Free text sent to the backend unencrypted. */
    JoinReasonDetail?: string;
    PreviousProviders?: PreviousProvider[];
    /** Free text sent to the backend unencrypted. */
    PreviousProviderDetail?: string;
}

export const submitOnboardingSurvey = (data: OnboardingSurveyPayload) => ({
    method: 'post',
    url: 'mail/v4/onboarding-survey/submit',
    data,
});

export const dismissOnboardingSurvey = (variant: Variant) => ({
    method: 'post',
    url: 'mail/v4/onboarding-survey/dismiss',
    data: { Variant: variant },
});
