export const VAULT_CONTENT_FORMAT_VERSION = 1;
export const LABEL_CONTENT_FORMAT_VERSION = 1;
export const ITEM_CONTENT_FORMAT_VERSION = 1;
export const MAX_BATCH_ITEMS_PER_REQUEST = 100;
export const ALIAS_OPTIONS_MAX_AGE = 10 * 60;
export const ALIAS_DETAILS_MAX_AGE = 30;

export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_ITEM_NOTE_LENGTH = 25_000;

export const ONBOARDING_LINK = {
    ANDROID: 'https://play.google.com/store/apps/details?id=proton.android.pass',
    IOS: 'https://apps.apple.com/us/app/proton-pass-password-manager/id6443490629',
    YOUTUBE: 'https://www.youtube.com/embed/Nm4DCAjePOM?cc_load_policy=1',
} as const;

export const TRIAL_BLOG_URL = 'https://proton.me/support/pass-trial';

export const PASS_BF_MONTHLY_PRICE = 199;

export const PASS_BF_2023_DATES = [
    ENV === 'development' ? Date.now() - 1 : +new Date('2023-10-31T06:00:00'),
    +new Date('2023-12-04T00:00:00'),
] as const;
