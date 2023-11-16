import { DriveLogo, MailLogo, PassLogo, VpnLogo } from '@proton/components/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getUsersFeature } from '@proton/components/containers/payments/features/highlights';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import {
    getBundlePlan,
    getBundleProPlan,
    getDrivePlan,
    getFamilyPlan,
    getMailPlan,
    getNewVisionaryPlan,
    getPassPlan,
    getVPNPlan,
} from '@proton/components/containers/payments/features/plan';
import {
    getAllPlatforms,
    getFreeFeatures,
    getRefundable,
    getVPNAppFeature,
} from '@proton/components/containers/payments/features/vpn';
import { FAMILY_MAX_USERS, PLANS } from '@proton/shared/lib/constants';
import { Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';

import bundleVpnPass from './bundle-vpn-pass.svg';
import bundle from './bundle.svg';
import { getCustomPassFeatures } from './pass/configuration';

export const getSummaryPlan = (
    plan: Plan | undefined,
    vpnServersCountData: VPNServersCountData,
    isSentinelPassplusEnabled: boolean
) => {
    const iconSize = 24;

    if (plan && plan?.Name === PLANS.VPN) {
        const shortPlan = getVPNPlan(plan, vpnServersCountData);
        return {
            logo: <VpnLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: [...shortPlan.features, getFreeFeatures(), getAllPlatforms(), getRefundable()],
        };
    }

    if (plan && plan?.Name === PLANS.PASS_PLUS) {
        const shortPlan = getPassPlan(plan);
        return {
            logo: <PassLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: getCustomPassFeatures(isSentinelPassplusEnabled),
        };
    }

    if (plan && plan?.Name === PLANS.BUNDLE) {
        const shortPlan = getBundlePlan(plan, vpnServersCountData);
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconSize} height={iconSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getStorageFeature(plan.MaxSpace),
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature({ serversCount: vpnServersCountData }),
                getPassAppFeature(),
            ],
        };
    }

    if (plan && plan?.Name === PLANS.DRIVE) {
        const shortPlan = getDrivePlan(plan);
        return {
            logo: <DriveLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
        };
    }

    if (plan && plan?.Name === PLANS.MAIL) {
        const shortPlan = getMailPlan(plan);
        return {
            logo: <MailLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
        };
    }

    if (plan && plan?.Name === PLANS.FAMILY) {
        const shortPlan = getFamilyPlan(plan, vpnServersCountData);
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconSize} height={iconSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getUsersFeature(FAMILY_MAX_USERS),
                getStorageFeature(plan.MaxSpace, { family: true }),
                getMailAppFeature(),
                getCalendarAppFeature({ family: true }),
                getDriveAppFeature({ family: true }),
                getVPNAppFeature({
                    family: true,
                    serversCount: vpnServersCountData,
                }),
                getPassAppFeature(),
            ],
        };
    }

    if (plan && plan?.Name === PLANS.NEW_VISIONARY) {
        const shortPlan = getNewVisionaryPlan(plan);
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconSize} height={iconSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getStorageFeature(plan.MaxSpace, { visionary: true }),
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature({ serversCount: vpnServersCountData }),
                getPassAppFeature(),
            ],
        };
    }

    if (plan && plan?.Name === PLANS.VPN_PASS_BUNDLE) {
        return {
            logo: (
                <div>
                    <img src={bundleVpnPass} width={iconSize} height={iconSize} alt={plan.Title} />
                </div>
            ),
            plan,
            title: plan.Title,
            features: [getPassAppFeature(), getVPNAppFeature({ serversCount: vpnServersCountData })],
        };
    }

    if (plan && plan?.Name === PLANS.BUNDLE_PRO) {
        const shortPlan = getBundleProPlan(plan);
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconSize} height={iconSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature({ serversCount: vpnServersCountData }),
                getPassAppFeature(),
            ],
        };
    }
};
