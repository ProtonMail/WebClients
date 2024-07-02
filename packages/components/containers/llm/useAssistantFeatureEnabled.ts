import { selectOrganization } from '@proton/account';
import { useFlag, useIsOrganizationBeforeBackfill, useScribePaymentsEnabled } from '@proton/components/containers';
import { baseUseSelector } from '@proton/react-redux-store';
import { PLANS } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';

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

    const paymentsEnabled = accessToAssistant && scribePaymentsEnabled && !isOrganizationBeforeBackfill;

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
         */
        enabled: paymentsEnabled && planSupportsScribe,
        killSwitch,
    };
};

export default useAssistantFeatureEnabled;

export const useAssistantAddonEnabledSignup = () => {
    const killSwitch = useFlag('AIAssistantToggleKillSwitch');
    const enabled = useFlag('AIAssistantAddonSignup');
    return !killSwitch && enabled;
};
