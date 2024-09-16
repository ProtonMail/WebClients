import type { IconSize } from '@proton/components';
import { DriveLogo, MailLogo, PassLogo, VpnLogo, WalletLogo } from '@proton/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature, getStorageFeature } from '@proton/components/containers/payments/features/drive';
import { getUsersFeature } from '@proton/components/containers/payments/features/highlights';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import {
    getAllAppsFeature,
    getBundlePlan,
    getBundleProPlan,
    getDriveBusinessPlan,
    getDrivePlan,
    getDuoPlan,
    getEarlyAccessFeature,
    getFamilyPlan,
    getMailBusinessPlan,
    getMailPlan,
    getMailProPlan,
    getPassBusinessSignupPlan,
    getPassEssentialsSignupPlan,
    getPassPlan,
    getVPNPlan,
    getVisionaryPlan,
    getWalletPlan,
} from '@proton/components/containers/payments/features/plan';
import {
    getAllPlatforms,
    getFreeFeatures,
    getRefundable,
    getVPNAppFeature,
} from '@proton/components/containers/payments/features/vpn';
import { DUO_MAX_USERS, FAMILY_MAX_USERS, PLANS } from '@proton/shared/lib/constants';
import type { FreePlanDefault, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
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

    if (plan && (plan.Name === PLANS.VPN || plan.Name === PLANS.VPN2024)) {
        const shortPlan = getVPNPlan(plan, vpnServersCountData);
        return {
            logo: <VpnLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: [...shortPlan.features, getFreeFeatures(), getAllPlatforms(), getRefundable()],
        };
    }

    if (plan && plan?.Name === PLANS.PASS) {
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

    if (plan && plan?.Name === PLANS.DRIVE_BUSINESS) {
        const shortPlan = getDriveBusinessPlan({ plan, freePlan });
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

    if (plan && plan?.Name === PLANS.DUO) {
        const shortPlan = getDuoPlan({ plan, serversCount: vpnServersCountData, freePlan });
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconImgSize} height={iconImgSize} alt={shortPlan.title} />
                </div>
            ),
            ...shortPlan,
            plan,
            features: [
                getUsersFeature(DUO_MAX_USERS),
                getStorageFeature(plan.MaxSpace, { duo: true, freePlan }),
                getMailAppFeature(),
                getCalendarAppFeature({ duo: true }),
                getDriveAppFeature({ duo: true }),
                getVPNAppFeature({
                    duo: true,
                    serversCount: vpnServersCountData,
                }),
                getPassAppFeature(),
            ],
        };
    }

    if (plan && plan?.Name === PLANS.VISIONARY) {
        // walletEnabled not important since we override the plans
        const shortPlan = getVisionaryPlan({ plan, freePlan, serversCount: vpnServersCountData, walletEnabled: false });
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
            features: [],
        };
    }

    if (plan && plan?.Name === PLANS.MAIL_PRO) {
        const shortPlan = getMailProPlan(plan);
        return {
            logo: <MailLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: [],
        };
    }

    if (plan && plan?.Name === PLANS.MAIL_BUSINESS) {
        const shortPlan = getMailBusinessPlan(plan);
        return {
            logo: <MailLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
            features: [],
        };
    }

    if (plan && plan?.Name === PLANS.WALLET) {
        const shortPlan = getWalletPlan(plan);
        return {
            logo: <WalletLogo variant="glyph-only" size={iconSize} />,
            ...shortPlan,
            plan,
        };
    }
};
