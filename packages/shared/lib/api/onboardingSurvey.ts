export const JOIN_REASONS = [
    'no_ads',
    'stop_reading_emails',
    'hacker_protection',
    'leave_big_tech',
    'new_address',
    'recommended',
    'other_proton_products',
    'work_business',
    'specific_feature',
    'other',
] as const;

export const PREVIOUS_PROVIDERS = ['gmail', 'outlook', 'yahoo', 'icloud', 'none', 'other'] as const;

export type JoinReason = (typeof JOIN_REASONS)[number];
export type PreviousProvider = (typeof PREVIOUS_PROVIDERS)[number];

export interface OnboardingSurveyPayload {
    JoinReason: JoinReason;
    /** Free text sent to the backend unencrypted. */
    JoinReasonDetail?: string;
    PreviousProviders: PreviousProvider[];
    /** Free text sent to the backend unencrypted. */
    PreviousProviderDetail?: string;
}

export const submitOnboardingSurvey = (data: OnboardingSurveyPayload) => ({
    method: 'post',
    url: 'mail/v4/onboarding-survey/submit',
    data,
});

export const dismissOnboardingSurvey = () => ({
    method: 'post',
    url: 'mail/v4/onboarding-survey/dismiss',
});
