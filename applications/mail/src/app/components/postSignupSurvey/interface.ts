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
