/**
 * Bitwarden stores android linked apps as :
 * `androidapp://ch.protonmail.android`
 */
export const BITWARDEN_ANDROID_APP_FLAG = 'androidapp://';

export const isBitwardenLinkedAndroidAppUrl = (url: string) => {
    try {
        return url.startsWith(BITWARDEN_ANDROID_APP_FLAG);
    } catch (e) {
        return false;
    }
};
