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

    // B2B plans
    // Note: Enterprise plan is currently *NOT* implemented anywhere,
    //       so it should not be handled.
    const isDriveProfessional = plan === PLANS.DRIVE_BUSINESS;
    const isProtonBusinessSuite = plan === PLANS.BUNDLE_PRO || plan === PLANS.BUNDLE_PRO_2024;

    const isB2B = isDriveProfessional || isProtonBusinessSuite;

    // B2C plans
    const isDriveLite = plan === PLANS.DRIVE_LITE;

    const isB2C = hasPaidDrive && !isB2B;

    // Upsells
    const canUpsellFree = !hasPaidDrive;
    const canUpsellB2B = isB2B && !isProtonBusinessSuite;

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

        /**
         * `true` if the user is on a Drive B2B plan.
         *
         * For Drive, only Drive-specific and ecosystem B2B plans are considered. \
         * i.e. Mail Professional is not be considered B2B in a Drive context.
         */
        isB2B,

        /**
         * `true` if the user is on a Drive B2C plan.
         *
         * For Drive, only Drive-specific and ecosystem B2C plans are considered. \
         * i.e. Mail Plus is not be considered B2C in a Drive context.
         */
        isB2C,

        /** `true` is plan is *Drive Professional*. */
        isDriveProfessional,

        /** `true` if plan is *Proton Business Suite*. */
        isProtonBusinessSuite,

        /** `true` if plan is *Drive Lite*. */
        isDriveLite,

        /** `true` if a B2C upsell is available. */
        canUpsellFree,

        /** `true` if a B2B upsell is available. */
        canUpsellB2B,
    };
};
