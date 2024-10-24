import { PLANS } from '@proton/payments/core/constants';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';

const PLANS_SUPPORTING_SCRIBE = [
    PLANS.MAIL_PRO,
    PLANS.MAIL_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
    PLANS.VISIONARY,
    PLANS.DUO,
    PLANS.FAMILY,
    PLANS.FREE,
    PLANS.DRIVE,
    PLANS.MAIL,
    PLANS.PASS,
    PLANS.VPN,
    PLANS.VPN2024,
    PLANS.WALLET,
    PLANS.BUNDLE,
    PLANS.VPN_PASS_BUNDLE,
];

export const isScribeSupported = (organization?: Organization, user?: UserModel): boolean => {
    if (!organization) {
        return false;
    }

    return PLANS_SUPPORTING_SCRIBE.includes(organization.PlanName) || (user ? user.isFree : false);
};
