import { PLANS } from '@proton/payments';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

export const getSsoKbUrl = (app: APP_NAMES) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return 'https://protonvpn.com/support/sso';
    }
    if (app === APPS.PROTONPASS) {
        return getKnowledgeBaseUrl('/pass-set-up-sso');
    }
};

export const getSsoUpsellPlan = (app: APP_NAMES) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return PLANS.VPN_BUSINESS;
    }
    if (app === APPS.PROTONPASS) {
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
