import type { FeatureFlagState } from './store/reducers';
import { PassFeature } from './types/api/features';

/** Invalidate local cache for users whose state version is older
 * than the minimum state version specified by these constants */
export const MIN_CACHE_VERSION = '1.10.0';

export const MAX_BATCH_PER_REQUEST = 100;
export const MAX_BATCH_ADDRESS_REQUEST = 10;
export const ALIAS_OPTIONS_MAX_AGE = 10 * 60;
export const ALIAS_DETAILS_MAX_AGE = 30;

export const DEFAULT_LOCK_TTL = 600; /* 10 minutes */

export const MAX_ITEM_NAME_LENGTH = 200;
export const MAX_ITEM_NOTE_LENGTH = 25_000;
export const MAX_PASSWORD_HISTORY_RETENTION_WEEKS = 2;

export const SESSION_RESUME_RETRY_TIMEOUT = 15; /* seconds */
export const SESSION_RESUME_MAX_RETRIES = 7;

export const MAX_VAULT_MEMBERS = 10;
export const MAX_CUSTOM_ADDRESSES = 10;

/** Matches 80% of the `SETTINGS_MAX_CONCURRENT_STREAMS=25`
 * production API configuration */
export const API_CONCURRENCY_TRESHOLD = 20;

export const PASS_WEB_APP_URL = 'https://pass.proton.me';
export const PASS_LEARN_MORE_URL = 'https://proton.me/pass';
export const PASS_VIDEO_URL = 'https://www.youtube.com/embed/Nm4DCAjePOM?cc_load_policy=1';
export const PASS_ANDROID_URL = 'https://play.google.com/store/apps/details?id=proton.android.pass';
export const PASS_IOS_URL = 'https://apps.apple.com/us/app/proton-pass-password-manager/id6443490629';
export const PASS_X_URL = 'https://x.com/Proton_Pass';
export const PASS_REDDIT_URL = 'https://www.reddit.com/r/ProtonPass/';
export const PASS_GITHUB_URL = 'https://github.com/ProtonMail/WebClients/tree/main/applications/pass-extension';
export const PASS_REQUEST_URL = 'https://protonmail.uservoice.com/forums/953584-proton-pass';
export const PASS_BLOG_TRIAL_URL = 'https://proton.me/support/pass-trial';
export const PASS_BLOG_MONITORING_URL = 'https://proton.me/support/dark-web-monitoring';
export const PASS_CHROME_URL = 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde';
export const PASS_FIREFOX_URL = 'https://addons.mozilla.org/en-US/firefox/addon/proton-pass/';
export const PASS_SENTINEL_LINK = 'https://proton.me/blog/sentinel-included-pass-plus';
export const PASS_LINUX_VERSION_URL = 'https://proton.me/download/PassDesktop/linux/x64/version.json';
export const PASS_LINUX_DOWNLOAD_URL = 'https://proton.me/support/set-up-proton-pass-linux';
export const PASS_DESKTOP_CHANGELOG_URL =
    'https://github.com/ProtonMail/WebClients/blob/main/applications/pass-desktop/CHANGELOG.md';
export const WEBSITE_RULES_URL = 'https://proton.me/download/pass/auto-detection/rules.json';

export const WEBSITE_RULES_SUPPORTED_VERSION = '1';

export const ITEM_COUNT_RATING_PROMPT = 10;

export const PASS_UPGRADE_PATH = 'pass/signup';
export enum AccountPath {
    ACCOUNT_PASSWORD = 'pass/account-password',
    ACCOUNT_PASSWORD_2FA = 'pass/account-password#two-fa',
    USERS = 'pass/users-addresses',
    POLICIES = 'pass/policies',
}

export const PASS_BF_MONTHLY_PRICE = 199;
export const PASS_REGULAR_MONTHLY_PRICE = 399;

export const PASS_BF_2023_DATES = [+new Date('2023-11-02T06:00:00'), +new Date('2023-12-04T00:00:00')] as const;

export enum UpsellRefPrefix {
    Extension = 'pass_extension',
    Web = 'pass_web',
    Desktop = 'pass_desktop',
}

export enum UpsellRef {
    DEFAULT = 'banner',
    FREE_TRIAL = 'free_trial_banner',
    IDENTITY_CUSTOM_FIELDS = 'identity_custom_fields',
    LIMIT_2FA = '2fa_limit',
    LIMIT_ALIAS = 'alias_limit',
    LIMIT_AUTOFILL = 'autofill_limit',
    LIMIT_CC = 'credit_card_limit',
    LIMIT_EXTRA_FIELD = 'extra_field_limit',
    LIMIT_IMPORT = 'import_limit',
    LIMIT_SHARING = 'limit_share',
    LIMIT_VAULT = 'vault_limit',
    MENU = 'menu',
    SECURE_LINKS = 'secure_links',
    SETTING = 'setting',
    PASS_MONITOR = 'pass_monitor',
    PASS_BIOMETRICS = 'pass_biometrics',
}

export const MAX_LOCAL_STORAGE_SIZE = 5 * 1024 * 1024; /* 5MB */
export const MAX_LOG_STORAGE_RATIO = 0.2; /* 20% of available storage space */
export const MAX_LOG_STORAGE_LINES = 2_000;
export const AVERAGE_BYTES_PER_LOG_LINE = 100;
export const SAFARI_MESSAGE_KEY = 'application.id';
export const SAFARI_URL_SCHEME = 'proton-pass:';
export const BIOMETRICS_KEY = 'offlineKey_biometrics';

/** Default feature flag states : These values are used as a
 * fallback if the feature flag endpoint is unavailable.
 * FIXME: Remove feature flags that are permanently enabled */
export const DEFAULT_PASS_FEATURES: FeatureFlagState = {
    [PassFeature.PassEnableDesktopAutoUpdate]: false,
    [PassFeature.PassUsernameSplit]: false,
    [PassFeature.PassWebInternalAlpha]: false,
    [PassFeature.PassWebOfflineMode]: false,
    [PassFeature.PassIdentityV1]: false,
    [PassFeature.PassDesktopBiometrics]: false,
};
