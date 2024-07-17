import { selectOrganization, selectUser } from '@proton/account';
import { useFlag, useIsOrganizationBeforeBackfill, useScribePaymentsEnabled } from '@proton/components/containers';
import { baseUseSelector } from '@proton/react-redux-store';
import { PLANS } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';
import { isOrganizationVisionary } from '@proton/shared/lib/organization/helper';

const PLANS_SUPPORTING_SCRIBE = [
    PLANS.MAIL_PRO,
    PLANS.MAIL_BUSINESS,
    PLANS.BUNDLE_PRO,
    PLANS.BUNDLE_PRO_2024,
    PLANS.VISIONARY,
];

function isScribeSupported(organization?: Organization): boolean {
    if (!organization) {
        return false;
    }

    return PLANS_SUPPORTING_SCRIBE.includes(organization.PlanName);
}

const useAssistantFeatureEnabled = () => {
    const killSwitch = useFlag('AIAssistantToggleKillSwitch');
    const accessToAssistant = useFlag('ComposerAssistant');
    const scribePaymentsEnabled = useScribePaymentsEnabled();
    const isOrganizationBeforeBackfill = useIsOrganizationBeforeBackfill();

    const organization = baseUseSelector(selectOrganization)?.value;
    const planSupportsScribe = isScribeSupported(organization);

    const paymentsEnabled = accessToAssistant && !isOrganizationBeforeBackfill && scribePaymentsEnabled;

    const user = baseUseSelector(selectUser)?.value;
    const userHasScribeSeat = !!user?.NumAI;

    // If the user has a scribe seat, it takes precedence over the feature flags
    // This is needed for the rollout as we can't sync the two feature flags
    // "AIAssistantAddonSignup" and "ComposerAssistant" to be shown to the same
    // cohort. Can be changed once this feature is fully rolled to users
    //
    // A check for the org is added so we gradually release the feature out
    // for visionaries as they have 6 AI seats assigned by default
    // TODO: Remove once Scribe has been fully rolled out
    const enabled =
        (userHasScribeSeat && !isOrganizationVisionary(organization)) ||
        (accessToAssistant &&
            !isOrganizationBeforeBackfill &&
            // you can't see anything Scribe related if the payments can't support you buying it
            // but if you have a seat you can still use it
            (scribePaymentsEnabled || userHasScribeSeat) &&
            // user can't enter scribe trial if the organization plan doesn't support it
            planSupportsScribe);

    return {
        /**
         * If Scribe can be purchased then it should be true. This flag doesn't take organization's plan into account
         * because free users should be able to buy Scribe too.
         */
        paymentsEnabled,
        /**
         * This flag controls if the configuration for scribe is available. Example: user management panel can
         * have an upsell for scribe addon. In this case we need to check both things: payments are possible and
         * scribe is supported by the organization's plan.
         * Kill switch takes precedence
         */
        enabled: killSwitch ? false : enabled,
        /**
         * Deactivates the feature across every product: Mail + Payments + Account
         */
        killSwitch,
    };
};

export default useAssistantFeatureEnabled;

export const useAssistantAddonEnabledSignup = () => {
    const killSwitch = useFlag('AIAssistantToggleKillSwitch');
    const enabled = useFlag('AIAssistantAddonSignup');
    return !killSwitch && enabled;
};
