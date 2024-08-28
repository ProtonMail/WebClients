import { selectOrganization, selectUser } from '@proton/account';
import { useIsOrganizationBeforeBackfill, useScribePaymentsEnabled } from '@proton/components/containers';
import { baseUseSelector } from '@proton/react-redux-store';
import { PLANS } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

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

    const user = baseUseSelector(selectUser)?.value;
    const userHasScribeSeat = !!user?.NumAI;

    const organization = baseUseSelector(selectOrganization)?.value;
    const planSupportsScribe = isScribeSupported(organization) || (user ? user.isFree : false);

    const paymentsEnabled = accessToAssistant && !isOrganizationBeforeBackfill && scribePaymentsEnabled;

    const enabled =
        accessToAssistant &&
        !isOrganizationBeforeBackfill &&
        // you can't see anything Scribe related if the payments can't support you buying it
        // but if you have a seat you can still use it
        (scribePaymentsEnabled || userHasScribeSeat) &&
        // user can't enter scribe trial if the organization plan doesn't support it
        planSupportsScribe;

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
    return !killSwitch;
};
