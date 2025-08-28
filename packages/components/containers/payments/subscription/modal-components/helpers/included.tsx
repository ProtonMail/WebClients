import { c } from 'ttag';

import { type FreePlanDefault, PLANS, type PlanIDs, type PlansMap, hasLumoAddonFromPlanIDs } from '@proton/payments';
import {
    BRAND_NAME,
    CALENDAR_SHORT_APP_NAME,
    DARK_WEB_MONITORING_NAME,
    DRIVE_SHORT_APP_NAME,
    DUO_MAX_USERS,
    FAMILY_MAX_USERS,
    MAIL_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import type { Included } from '@proton/shared/lib/helpers/checkout';
import { getPremiumPasswordManagerText } from '@proton/shared/lib/helpers/checkout';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getPremium } from '@proton/shared/lib/helpers/premium';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getVpnConnections, getVpnServers } from '@proton/shared/lib/vpn/features';

import { getNUsersText } from '../../../features/highlights';
import { getAccessToAdvancedAIText, getFullChatHistoryText, getUnlimitedChatsText } from '../../../features/lumo';
import {
    get2FAAuthenticatorText,
    getAdvancedAliasFeaturesText,
    getLoginsAndNotesText,
    getPassUsersText,
    getProtonPassFeatureTooltipText,
    getSecureSharingText,
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

    // Default included features
    let included: Included[] = [
        {
            type: 'value',
            text: c('Info').t`Total storage`,
            value: humanSize({ bytes: summary.space || freePlan.MaxSpace, fraction: 0 }),
        },
        { type: 'value', text: c('Info').t`Total email addresses`, value: summary.addresses || freePlan.MaxAddresses },
        { type: 'value', text: c('Info').t`Total supported domains`, value: summary.domains || freePlan.MaxDomains },
        { type: 'value', text: c('Info').t`Total VPN connections`, value: summary.vpn || freePlan.MaxVPN },
    ];

    const vpnPassBundle = planIDs[PLANS.VPN_PASS_BUNDLE];
    if (vpnPassBundle) {
        included = [
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
        included = [
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

    const vpn = planIDs[PLANS.VPN2024];
    if (vpn !== undefined && vpn > 0) {
        included = [
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

    const passFeatures: Included[] = [
        {
            type: 'text',
            text: getLoginsAndNotesText('paid'),
        },
        {
            type: 'text',
            text: getUnlimitedHideMyEmailAliasesText(),
        },
        {
            type: 'text',
            text: getAdvancedAliasFeaturesText(),
        },
        {
            type: 'text',
            text: getSecureSharingText(),
        },
        {
            type: 'text',
            text: get2FAAuthenticatorText(),
        },
    ];

    const passPremium = planIDs[PLANS.PASS];
    if (passPremium !== undefined && passPremium > 0) {
        included = passFeatures;
    }

    const passLifetime = planIDs[PLANS.PASS_LIFETIME];
    if (passLifetime !== undefined && passLifetime > 0) {
        included = [
            {
                type: 'text',
                text: getProtonPassFeatureTooltipText(),
            },
            ...passFeatures,
        ];
    }

    const passFamily = planIDs[PLANS.PASS_FAMILY];
    if (passFamily !== undefined && passFamily > 0) {
        included = [
            {
                type: 'text',
                text: getPassUsersText(FAMILY_MAX_USERS),
            },
            {
                type: 'text',
                text: getLoginsAndNotesText('paid'),
            },
            {
                type: 'text',
                text: getUnlimitedHideMyEmailAliasesText(),
            },
            {
                type: 'text',
                text: getAdvancedAliasFeaturesText(),
            },
            {
                type: 'text',
                text: getSecureSharingText(true),
            },
            {
                type: 'text',
                text: DARK_WEB_MONITORING_NAME,
            },
            {
                type: 'text',
                text: get2FAAuthenticatorText(),
            },
        ];
    }

    const family = planIDs[PLANS.FAMILY];
    if (family !== undefined && family > 0) {
        const storage = humanSize({
            bytes: summary.space || freePlan.MaxSpace,
            fraction: 0,
        });

        included = [
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
            {
                type: 'text',
                text: c('Info').t`${BRAND_NAME} Scribe writing assistant`,
            },
        ];
    }

    const duo = planIDs[PLANS.DUO];
    if (duo !== undefined && duo > 0) {
        const storage = humanSize({
            bytes: summary.space || freePlan.MaxSpace,
            fraction: 0,
        });

        included = [
            {
                type: 'text',
                text: getNUsersText(DUO_MAX_USERS),
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
            {
                type: 'text',
                text: c('Info').t`${BRAND_NAME} Scribe writing assistant`,
            },
        ];
    }

    const lumoPlan = planIDs[PLANS.LUMO];
    const lumoAddon = hasLumoAddonFromPlanIDs(planIDs);
    const lumoFeatures: Included[] = [
        {
            type: 'text',
            text: getAccessToAdvancedAIText(),
        },
        {
            type: 'text',
            text: getUnlimitedChatsText(),
        },
        {
            type: 'text',
            text: getFullChatHistoryText(),
        },
        {
            type: 'text',
            text: c('collider_2025: feature').t`Large file upload support`,
        },
    ];

    if (lumoPlan !== undefined && lumoPlan > 0) {
        included = lumoFeatures;
    } else if (lumoAddon) {
        included = [...included, ...lumoFeatures];
    }

    return included;
};
