import { DriveLogo, IconSize, MailLogo, PassLogo, VpnLogo } from '@proton/components/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getUsersFeature } from '@proton/components/containers/payments/features/highlights';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import {
    getAllAppsFeature,
    getBundlePlan,
    getBundleProPlan,
    getDrivePlan,
    getEarlyAccessFeature,
    getFamilyPlan,
    getMailPlan,
    getNewVisionaryPlan,
    getPassBusinessSignupPlan,
    getPassEssentialsSignupPlan,
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
import { FreePlanDefault, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { CSS_BASE_UNIT_SIZE } from '@proton/styles';

import bundleVpnPass from './bundle-vpn-pass.svg';
import bundle from './bundle.svg';
import { getCustomPassFeatures } from './pass/configuration';

export const getSummaryPlan = ({
    plan,
    vpnServersCountData,
    freePlan,
}: {
    plan: Plan | undefined;
    vpnServersCountData: VPNServersCountData;
    freePlan: FreePlanDefault;
}) => {
    const iconSize: IconSize = 6;
    const iconImgSize = iconSize * CSS_BASE_UNIT_SIZE;

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

    if (plan && plan?.Name === PLANS.PASS_PRO) {
        const shortPlan = getPassEssentialsSignupPlan(plan);
        return {
            logo: <PassLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: [],
        };
    }

    if (plan && plan?.Name === PLANS.PASS_BUSINESS) {
        const shortPlan = getPassBusinessSignupPlan(plan);
        return {
            logo: <PassLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: [],
        };
    }

    if (plan && plan?.Name === PLANS.BUNDLE) {
        const shortPlan = getBundlePlan({ plan, vpnServersCountData, freePlan });
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconImgSize} height={iconImgSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getStorageFeature(plan.MaxSpace, { freePlan }),
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature({ serversCount: vpnServersCountData }),
                getPassAppFeature(),
            ],
        };
    }

    if (plan && plan?.Name === PLANS.DRIVE) {
        const shortPlan = getDrivePlan({ plan, freePlan });
        return {
            logo: <DriveLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
        };
    }

    if (plan && plan?.Name === PLANS.MAIL) {
        const shortPlan = getMailPlan({ plan, freePlan });
        return {
            logo: <MailLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
        };
    }

    if (plan && plan?.Name === PLANS.FAMILY) {
        const shortPlan = getFamilyPlan({ plan, serversCount: vpnServersCountData, freePlan });
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconImgSize} height={iconImgSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getUsersFeature(FAMILY_MAX_USERS),
                getStorageFeature(plan.MaxSpace, { family: true, freePlan }),
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
        const shortPlan = getNewVisionaryPlan({ plan, freePlan });
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconImgSize} height={iconImgSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getStorageFeature(plan.MaxSpace, { visionary: true, freePlan }),
                getUsersFeature(plan.MaxMembers),
                getAllAppsFeature(),
                getEarlyAccessFeature(),
            ],
        };
    }

    if (plan && plan?.Name === PLANS.VPN_PASS_BUNDLE) {
        return {
            logo: (
                <div>
                    <img src={bundleVpnPass} width={iconImgSize} height={iconImgSize} alt={plan.Title} />
                </div>
            ),
            plan,
            title: plan.Title,
            features: [getPassAppFeature(), getVPNAppFeature({ serversCount: vpnServersCountData })],
        };
    }

    if (plan && (plan?.Name === PLANS.BUNDLE_PRO || plan?.Name === PLANS.BUNDLE_PRO_2024)) {
        const shortPlan = getBundleProPlan(plan);
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconImgSize} height={iconImgSize} alt={shortPlan.title} />
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
