import { APPS, type APP_NAMES, APP_UPSELL_REF_PATH, type UPSELL_COMPONENT, type UPSELL_FEATURE } from '../constants';

/**
 * Generate upsell ref from app component and feature
 *
 * @param app => Current app from which we open a link
 * @param feature => feature identifier to include in the path
 * @param component => Optional, ref component (e.g. banner, modal, button)
 * @param isSettings => Optional, true if this upsell ref is in the apps settings
 */
export const getUpsellRef = ({
    app,
    feature,
    component,
    isSettings = false,
}: {
    app: `${APP_UPSELL_REF_PATH}`;
    feature: UPSELL_FEATURE;
    component?: `${UPSELL_COMPONENT}`;
    /** Is in settings section */
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
    feature: UPSELL_FEATURE;
    component?: UPSELL_COMPONENT;
    fromApp?: APP_NAMES;
}) => {
    if (app === APPS.PROTONMAIL) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONCALENDAR) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.CALENDAR_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONDRIVE) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.DRIVE_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONLUMO) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.LUMO_UPSELL_REF_PATH, feature, component });
    } else if (app === APPS.PROTONVPN_SETTINGS) {
        return getUpsellRef({ app: APP_UPSELL_REF_PATH.VPN_UPSELL_REF_PATH, feature, component });
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
        } else if (fromApp === APPS.PROTONLUMO) {
            return getUpsellRef({
                app: APP_UPSELL_REF_PATH.LUMO_UPSELL_REF_PATH,
                feature,
                component,
                isSettings: true,
            });
        }
    }

    return undefined;
};
