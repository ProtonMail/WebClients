import { c } from 'ttag';

import {
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    FAMILY_MAX_USERS,
    MAIL_SHORT_APP_NAME,
    PLANS,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { Included, getPremiumPasswordManagerText } from '@proton/shared/lib/helpers/checkout';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getPremium } from '@proton/shared/lib/helpers/premium';
import { FreePlanDefault, PlanIDs, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getVpnConnections, getVpnServers } from '@proton/shared/lib/vpn/features';

import { getNUsersText } from '../../../features/highlights';
import {
    get2FAAuthenticatorText,
    getDevicesText,
    getLoginsAndNotesText,
    getUnlimitedHideMyEmailAliasesText,
} from '../../../features/pass';

export const getWhatsIncluded = ({
    planIDs,
    plansMap,
    vpnServers,
    freePlan,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    vpnServers: VPNServersCountData;
    freePlan: FreePlanDefault;
}): Included[] => {
    const vpnPassBundle = planIDs[PLANS.VPN_PASS_BUNDLE];
    if (vpnPassBundle) {
        return [
            {
                type: 'text',
                text: getPremium(VPN_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremiumPasswordManagerText(),
            },
        ];
    }
    const unlimited = planIDs[PLANS.BUNDLE];
    const unlimitedPlan = plansMap[PLANS.BUNDLE];
    if (unlimited && unlimitedPlan) {
        const storage = humanSize({
            bytes: unlimitedPlan.MaxSpace,
            fraction: 0,
        });
        return [
            {
                type: 'text',
                text: storage,
            },
            {
                type: 'text',
                text: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremium(VPN_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremium(DRIVE_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremiumPasswordManagerText(),
            },
        ];
    }

    const vpn = planIDs[PLANS.VPN];
    if (vpn !== undefined && vpn > 0) {
        return [
            {
                type: 'text',
                text: getVpnServers(vpnServers.paid.servers),
            },
            {
                type: 'text',
                text: c('specialoffer: Deal details').t`Highest VPN speed`,
            },
            {
                type: 'text',
                text: c('specialoffer: Deal details').t`Secure streaming`,
            },
            {
                type: 'text',
                text: getVpnConnections(10),
            },
        ];
    }
    const passPremium = planIDs[PLANS.PASS_PLUS];
    if (passPremium !== undefined && passPremium > 0) {
        return [
            {
                type: 'text',
                text: getLoginsAndNotesText(),
            },
            {
                type: 'text',
                text: getDevicesText(),
            },
            {
                type: 'text',
                text: getUnlimitedHideMyEmailAliasesText(),
            },
            {
                type: 'text',
                text: get2FAAuthenticatorText(),
            },
        ];
    }

    const summary = Object.entries(planIDs).reduce(
        (acc, [planNameValue, quantity]) => {
            const planName = planNameValue as keyof PlansMap;
            const plan = plansMap[planName];
            if (!plan || !quantity || quantity <= 0) {
                return acc;
            }
            acc.addresses += plan.MaxAddresses * quantity;
            acc.domains += plan.MaxDomains * quantity;
            acc.space += plan.MaxSpace * quantity;
            acc.vpn += plan.MaxVPN * quantity;
            return acc;
        },
        { space: 0, addresses: 0, domains: 0, vpn: 0 }
    );

    const family = planIDs[PLANS.FAMILY];
    if (family !== undefined && family > 0) {
        const storage = humanSize({
            bytes: summary.space || freePlan.MaxSpace,
            fraction: 0,
        });

        return [
            {
                type: 'text',
                text: getNUsersText(FAMILY_MAX_USERS),
            },
            {
                type: 'text',
                text: c('Info').t`${storage} storage`,
            },
            {
                type: 'text',
                text: getPremium(MAIL_SHORT_APP_NAME, CALENDAR_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremium(VPN_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremium(DRIVE_SHORT_APP_NAME),
            },
            {
                type: 'text',
                text: getPremiumPasswordManagerText(),
            },
        ];
    }

    return [
        {
            type: 'value',
            text: c('Info').t`Total storage`,
            value: humanSize({ bytes: summary.space || freePlan.MaxSpace, fraction: 0 }),
        },
        { type: 'value', text: c('Info').t`Total email addresses`, value: summary.addresses || freePlan.MaxAddresses },
        { type: 'value', text: c('Info').t`Total supported domains`, value: summary.domains || freePlan.MaxDomains },
        { type: 'value', text: c('Info').t`Total VPN connections`, value: summary.vpn || freePlan.MaxVPN },
    ];
};
