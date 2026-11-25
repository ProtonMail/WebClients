import { PLANS } from '@proton/payments/core/constants';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const getSsoKbUrl = (app: APP_NAMES) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return 'https://protonvpn.com/support/sso';
    }
    if (app === APPS.PROTONPASS) {
        return getKnowledgeBaseUrl('/pass-set-up-sso');
    }
    if (app === APPS.PROTONLUMO) {
        return getKnowledgeBaseUrl('/lumo-set-up-sso');
    }
    if (app === APPS.PROTONCONSOLE) {
        // TODO: Link a Console SSO article once there is one; the Pass article is used until then.
        return getKnowledgeBaseUrl('/pass-set-up-sso');
    }
};

const getSsoUpsellPlan = (app: APP_NAMES) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return PLANS.VPN_BUSINESS;
    }
    if (app === APPS.PROTONPASS) {
        return PLANS.PASS_BUSINESS;
    }
    if (app === APPS.PROTONLUMO) {
        return PLANS.LUMO_BUSINESS;
    }
    if (app === APPS.PROTONCONSOLE) {
        // TODO: Pick the upsell plan for Console; Pass's is used until then, and only shows the Upgrade button.
        return PLANS.PASS_BUSINESS;
    }
};

export interface SsoAppInfo {
    upsellPlan: PLANS | undefined;
    kbUrl: string | undefined;
    type: 'global-sso' | 'vpn-sso';
}

export const getSsoAppInfo = (app: APP_NAMES, planName?: PLANS): SsoAppInfo => {
    return {
        upsellPlan: getSsoUpsellPlan(app),
        kbUrl: getSsoKbUrl(app),
        type: [PLANS.VPN_PRO, PLANS.VPN_BUSINESS].includes(planName as any) ? 'vpn-sso' : 'global-sso',
    };
};
