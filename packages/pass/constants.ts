export const VAULT_CONTENT_FORMAT_VERSION = 1;
export const LABEL_CONTENT_FORMAT_VERSION = 1;
export const ITEM_CONTENT_FORMAT_VERSION = 1;
export const MAX_BATCH_ITEMS_PER_REQUEST = 100;
export const ALIAS_OPTIONS_MAX_AGE = 10 * 60;
export const ALIAS_DETAILS_MAX_AGE = 30;

export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_ITEM_NOTE_LENGTH = 25_000;

export const PASS_VIDEO_URL = 'https://www.youtube.com/embed/Nm4DCAjePOM?cc_load_policy=1';
export const PASS_ANDROID_URL = 'https://play.google.com/store/apps/details?id=proton.android.pass';
export const PASS_IOS_URL = 'https://apps.apple.com/us/app/proton-pass-password-manager/id6443490629';
export const PASS_X_URL = 'https://x.com/Proton_Pass';
export const PASS_REDDIT_URL = 'https://www.reddit.com/r/ProtonPass/';
export const PASS_GITHUB_URL = 'https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension';
export const PASS_REQUEST_URL = 'https://protonmail.uservoice.com/forums/953584-proton-pass';
export const PASS_BLOG_TRIAL_URL = 'https://proton.me/support/pass-trial';

export const PASS_BF_MONTHLY_PRICE = 199;

export const PASS_BF_2023_DATES = [
    ENV === 'development' ? Date.now() - 1 : +new Date('2023-11-02T06:00:00'),
    +new Date('2023-12-04T00:00:00'),
] as const;
