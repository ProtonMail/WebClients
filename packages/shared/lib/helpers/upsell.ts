import { APPS, APP_NAMES, APP_UPSELL_REF_PATH, UPSELL_COMPONENT } from '@proton/shared/lib/constants';

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
 * Generate upsell ref from app component and feature
 *
 * @param app => Current app from which we open a link
 * @param feature => feature identifier to include in the path
 * @param component => Optional, ref component (e.g. banner, modal, button)
 */
export const getUpsellRef = ({
    app,
    feature,
    component,
    isSettings = false,
}: {
    app: APP_UPSELL_REF_PATH;
    feature: string;
    component?: UPSELL_COMPONENT;
    isSettings?: boolean;
}) => {
    const upsellComponent = component || '';
    const upsellInSettings = isSettings ? '_settings' : '';

    return `${app}${upsellComponent}${feature}${upsellInSettings}`;
};

/**
 * Generate upsell ref from the current app, the "feature" identifier, the "component" and the "from app"
 *
 * @param app => Current app from which we open a link
 * @param feature => feature identifier to include in the path
 * @param component => Optional, ref component (e.g. banner, modal, button)
 * @param fromApp => Optional, "parent app" of the current app (e.g. in mail settings, app=account and fromApp=mail)
 *
 * Return a ref string like "upsell_mail-banner-auto-reply_settings"
 */
export const getUpsellRefFromApp = ({
    app,
    fromApp,
    component,
    feature,
}: {
    app: APP_NAMES;
    feature: string;
    component?: UPSELL_COMPONENT;
    fromApp?: APP_NAMES;
}) => {
    if (app === APPS.PROTONMAIL) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONCALENDAR) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONDRIVE) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONACCOUNT && fromApp) {
        if (fromApp === APPS.PROTONMAIL) {
            return getUpsellRef({
                app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
                feature,
                component,
                isSettings: true,
            });
        } else if (fromApp === APPS.PROTONCALENDAR) {
            return getUpsellRef({
                app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH,
                feature,
                component,
                isSettings: true,
            });
        } else if (fromApp === APPS.PROTONDRIVE) {
            return getUpsellRef({
                app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH,
                feature,
                component,
                isSettings: true,
            });
        } else if (fromApp === APPS.PROTONPASS) {
            return getUpsellRef({
                app: APP_UPSELL_REF_PATH.PASS_UPSELL_REF_PATH,
                feature,
                component,
                isSettings: true,
            });
        } else if (fromApp === APPS.PROTONVPN_SETTINGS) {
            return getUpsellRef({ app: APP_UPSELL_REF_PATH.VPN_UPSELL_REF_PATH, feature, component, isSettings: true });
        }
    }

    return undefined;
};
