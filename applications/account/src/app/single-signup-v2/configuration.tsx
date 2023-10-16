import { PassLogo, VpnLogo } from '@proton/components/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature } from '@proton/components/containers/payments/features/drive';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import {
    getBundlePlan,
    getBundleProPlan,
    getPassPlan,
    getVPNPlan,
} from '@proton/components/containers/payments/features/plan';
import {
    getAllPlatforms,
    getFreeFeatures,
    getRefundable,
    getVPNAppFeature,
} from '@proton/components/containers/payments/features/vpn';
import { APPS, APP_NAMES, PLANS } from '@proton/shared/lib/constants';
import { Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';

import { BenefitItem } from './Benefits';
import bundle from './bundle.svg';
import { getCustomPassFeatures, getPassBenefits } from './pass/configuration';

export const getSummaryPlan = (plan: Plan | undefined, vpnServersCountData: VPNServersCountData) => {
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
            features: getCustomPassFeatures(),
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
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature({ serversCount: vpnServersCountData }),
                getPassAppFeature(),
            ],
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

export const getBenefitItems = (app: APP_NAMES): BenefitItem[] | undefined => {
    if (app === APPS.PROTONPASS) {
        return getPassBenefits();
    }
};
