import { type COUPON_CODES, type CYCLE, PLANS, type Subscription, getPlan } from '@proton/payments';
import type { APP_NAMES, UPSELL_COMPONENT, UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { APPS, APP_UPSELL_REF_PATH } from '@proton/shared/lib/constants';
import type { Audience, UserModel } from '@proton/shared/lib/interfaces';

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

export const getUpgradePath = ({
    user,
    subscription,
    plan,
    app,
    audience,
    target,
    coupon,
    cycle,
    minimumCycle,
    maximumCycle,
}: {
    user?: UserModel;
    plan?: PLANS;
    subscription?: Subscription;
    audience?: Audience;
    app?: APP_NAMES;
    target?: 'compare' | 'checkout';
    coupon?: COUPON_CODES;
    cycle?: CYCLE;
    minimumCycle?: CYCLE;
    maximumCycle?: CYCLE;
}) => {
    const params = new URLSearchParams();
    if (plan) {
        params.set('plan', plan);
    }
    if (audience) {
        params.set('audience', audience);
    }
    if (coupon) {
        params.set('coupon', coupon);
    }
    if (cycle) {
        params.set('cycle', cycle.toString());
    }
    if (minimumCycle) {
        params.set('minimumCycle', minimumCycle.toString());
    }
    if (maximumCycle) {
        params.set('maximumCycle', maximumCycle.toString());
    }

    if (!user || user.isFree) {
        if (app === APPS.PROTONVPN_SETTINGS) {
            return `/dashboard${params.size ? `?${params}` : ''}`;
        }
        return `/upgrade${params.size ? `?${params}` : ''}`;
    }
    const currentPlan = getPlan(subscription);
    // A plan is needed to open the subscription modal
    if (!params.has('plan')) {
        params.set('plan', currentPlan?.Name ?? PLANS.BUNDLE);
    }
    params.set('target', target ?? 'compare');
    return `/dashboard?${params}`;
};

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
