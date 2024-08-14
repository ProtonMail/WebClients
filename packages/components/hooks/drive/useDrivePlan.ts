import { PLANS } from '@proton/shared/lib/constants';

import { useOrganization } from '../useOrganization';
import { useUser } from '../useUser';

/**
 * This hook centralized logic for Drive subscriptions.
 */
export const useDrivePlan = () => {
    const [{ hasPaidDrive, isAdmin }] = useUser();
    const [organization] = useOrganization();
    const plan = organization?.PlanName || PLANS.FREE;

    const isB2B =
        // Drive Professional
        plan === PLANS.DRIVE_BUSINESS ||
        // Proton Business Suite
        plan === PLANS.BUNDLE_PRO ||
        plan === PLANS.BUNDLE_PRO_2024 ||
        // Enterprise
        plan === PLANS.ENTERPRISE;

    const canUpsellFree = !hasPaidDrive;
    const canUpsellB2B = isB2B && plan !== PLANS.ENTERPRISE;

    return {
        /** `true` if the user has a paid Drive plan. */
        hasPaidDrive,

        /** `true` if the user is admin of their organization. */
        isAdmin,

        /**
         * The organization attached to the current user.
         */
        organization,

        /** The {@link PLANS} the user is subscribed to. */
        plan,

        /** `true` if the user is on a Drive B2B plan. */
        isB2B,

        /** `true` if a B2C upsell is available. */
        canUpsellFree,

        /** `true` if a B2B upsell is available. */
        canUpsellB2B,
    };
};
