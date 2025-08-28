import { PLANS } from '@proton/payments';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';

// B2C plans having Scribe by default
const B2C_PLANS_INCLUDING_SCRIBE = [PLANS.VISIONARY, PLANS.DUO, PLANS.FAMILY];

// B2C plans which don't have Scribe included, but who can try Scribe and to which we upsell proton DUO
export const B2C_PLANS_SUPPORTING_SCRIBE = [
    PLANS.FREE,
    PLANS.MAIL,
    PLANS.DRIVE,
    PLANS.BUNDLE,
    PLANS.VPN2024,
    PLANS.PASS,
    PLANS.VPN_PASS_BUNDLE,
];

// B2B plans which can try Scribe and pay for addons
export const B2B_PLANS_SUPPORTING_SCRIBE = [
    PLANS.MAIL_PRO,
    PLANS.MAIL_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
];

export const PLANS_SUPPORTING_SCRIBE = [
    ...B2C_PLANS_INCLUDING_SCRIBE,
    ...B2C_PLANS_SUPPORTING_SCRIBE,
    ...B2B_PLANS_SUPPORTING_SCRIBE,
];

export const isScribeSupported = (organization?: Organization, user?: UserModel): boolean => {
    if (user?.isFree) {
        return true;
    }

    if (!organization) {
        return false;
    }

    return PLANS_SUPPORTING_SCRIBE.includes(organization.PlanName);
};

export const isB2bPlanSupportingScribe = (organization?: Organization, user?: UserModel): boolean => {
    if (!organization || user?.isFree) {
        return false;
    }

    return B2B_PLANS_SUPPORTING_SCRIBE.includes(organization.PlanName);
};
