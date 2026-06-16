import { c } from 'ttag';

import { PLANS } from '@proton/payments';
import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
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
    PLANS.BUNDLE_BIZ_2025,
];

export const PLANS_SUPPORTING_SCRIBE = [
    ...B2C_PLANS_INCLUDING_SCRIBE,
    ...B2C_PLANS_SUPPORTING_SCRIBE,
    ...B2B_PLANS_SUPPORTING_SCRIBE,
];

export const isScribeSupported = (organization?: Organization, user?: UserModel, scribeToLumo = false): boolean => {
    // When the Scribe→Lumo rebrand is enabled, existing Scribe add-on holders (NumAI > 0) keep access.
    if (user?.isFree || (user?.NumLumo ?? 0) > 0 || (scribeToLumo && (user?.NumAI ?? 0) > 0)) {
        return true;
    }

    if (!organization) {
        return false;
    }

    return PLANS_SUPPORTING_SCRIBE.includes(organization.PlanName);
};

export const getWritingAssistantTitle = (scribeToLumo: boolean): string =>
    scribeToLumo
        ? c('Title').t`${LUMO_SHORT_APP_NAME} writing assistant`
        : c('Title').t`${BRAND_NAME} Scribe writing assistant`;

export const isB2bPlanSupportingScribe = (organization?: Organization, user?: UserModel): boolean => {
    if (!organization || user?.isFree) {
        return false;
    }

    return B2B_PLANS_SUPPORTING_SCRIBE.includes(organization.PlanName);
};
