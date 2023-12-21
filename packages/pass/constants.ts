export const VAULT_CONTENT_FORMAT_VERSION = 1;
export const LABEL_CONTENT_FORMAT_VERSION = 1;
export const ITEM_CONTENT_FORMAT_VERSION = 1;
export const MAX_BATCH_ITEMS_PER_REQUEST = 100;
export const ALIAS_OPTIONS_MAX_AGE = 10 * 60;
export const ALIAS_DETAILS_MAX_AGE = 30;

export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_ITEM_NOTE_LENGTH = 25_000;

export const PASS_LEARN_MORE_URL = 'https://proton.me/pass';
export const PASS_VIDEO_URL = 'https://www.youtube.com/embed/Nm4DCAjePOM?cc_load_policy=1';
export const PASS_ANDROID_URL = 'https://play.google.com/store/apps/details?id=proton.android.pass';
export const PASS_IOS_URL = 'https://apps.apple.com/us/app/proton-pass-password-manager/id6443490629';
export const PASS_X_URL = 'https://x.com/Proton_Pass';
export const PASS_REDDIT_URL = 'https://www.reddit.com/r/ProtonPass/';
export const PASS_GITHUB_URL = 'https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension';
export const PASS_REQUEST_URL = 'https://protonmail.uservoice.com/forums/953584-proton-pass';
export const PASS_BLOG_TRIAL_URL = 'https://proton.me/support/pass-trial';
export const PASS_CHROME_URL = 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde';
export const PASS_FIREFOX_URL = 'https://addons.mozilla.org/en-US/firefox/addon/proton-pass/';
export const PASS_SENTINEL_LINK = 'https://proton.me/blog/sentinel-included-pass-plus';

export const ITEM_COUNT_RATING_PROMPT = ENV === 'production' ? 10 : 1;

export const PASS_BF_MONTHLY_PRICE = 199;
export const PASS_BF_2023_DATES = [
    ENV === 'development' ? Date.now() - 1 : +new Date('2023-11-02T06:00:00'),
    +new Date('2023-12-04T00:00:00'),
] as const;

export const PASS_EOY_DATE_END = +new Date('2024-01-03T09:00:00');
export const PASS_UPGRADE_PATH = 'pass/upgrade';
export const PASS_EOY_PATH = `pass/signup?plan=pass2023&cycle=12&coupon=EOY2023`;
export const PASS_REF_EXTENSION_MODAL = 'pass_extension_eoy_2023_banner';
export const PASS_REF_WEB_MODAL = 'pass_web_eoy_2023_banner';
export const PASS_REF_EXTENSION_VAULT = 'pass_extension_vault_limit';
export const PASS_REF_WEB_VAULT = 'pass_web_vault_limit';
export const PASS_REF_EXTENSION_SETTINGS = 'pass_extension_setting';
export const PASS_REF_WEB_SETTINGS = 'pass_web_setting';
export const PASS_REF_EXTENSION_MENU = 'pass_extension_menu';
export const PASS_REF_WEB_MENU = 'pass_web_menu';
export const PASS_REF_EXTENSION_2FA = 'pass_extension_2fa_limit';
export const PASS_REF_WEB_2FA = 'pass_web_2fa_limit';
export const PASS_REF_EXTENSION_ALIAS = 'pass_extension_alias_limit';
export const PASS_REF_WEB_ALIAS = 'pass_web_alias_limit';
export const PASS_REF_EXTENSION_AUTOFILL = 'pass_extension_autofill_limit';
export const PASS_REF_WEB_AUTOFILL = 'pass_web_autofill_limit';
export const PASS_REF_EXTENSION_IMPORT = 'pass_extension_import_limit';
export const PASS_REF_WEB_IMPORT = 'pass_web_import_limit';
export const PASS_REF_EXTENSION_EXTRA_FIELD = 'pass_extension_extra_field_limit';
export const PASS_REF_WEB_EXTRA_FIELD = 'pass_web_extra_field_limit';
export const PASS_REF_EXTENSION_SHARE = 'pass_extension_share_limit';
export const PASS_REF_WEB_SHARE = 'pass_web_share_limit';
export const PASS_REF_EXTENSION_CARD = 'pass_extension_credit_card_limit';
export const PASS_REF_WEB_CARD = 'pass_web_credit_card_limit';
