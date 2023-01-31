import { APPS, APP_NAMES, APP_UPSELL_REF_PATH } from '@proton/shared/lib/constants';

/**
 * Add an upsell ref param to a URL
 */
export const addUpsellPath = (link: string, upsellPath?: string) => {
    if (!upsellPath) {
        return link;
    }

    const hasParams = link.includes('?');
    return hasParams ? `${link}&ref=${upsellPath}` : `${link}?ref=${upsellPath}`;
};

/**
 * Generate upsell ref from the current app, the "feature" identifier and the "from app"
 *
 * @param app => Current app from which we open a link
 * @param ref => feature identifier to include in the path
 * @param fromApp => Optional, "parent app" of the current app (e.g. in mail settings, app=account and fromApp=mail)
 */
export const getUpsellAppRef = (app: APP_NAMES, ref: string, fromApp?: APP_NAMES) => {
    if (app === APPS.PROTONMAIL) {
        return `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${ref}`;
    } else if (app === APPS.PROTONCALENDAR) {
        return `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${ref}`;
    } else if (app === APPS.PROTONDRIVE) {
        return `${APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH}${ref}`;
    } else if (app === APPS.PROTONACCOUNT && fromApp) {
        if (fromApp === APPS.PROTONMAIL) {
            return `${APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH}${ref}_settings`;
        } else if (fromApp === APPS.PROTONCALENDAR) {
            return `${APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH}${ref}_settings`;
        } else if (fromApp === APPS.PROTONDRIVE) {
            return `${APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH}${ref}_settings`;
        } else if (fromApp === APPS.PROTONVPN_SETTINGS) {
            return `${APP_UPSELL_REF_PATH.VPN_UPSELL_REF_PATH}${ref}_settings`;
        }
    }

    return undefined;
};
