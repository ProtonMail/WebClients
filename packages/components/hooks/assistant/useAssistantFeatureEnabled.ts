import { selectOrganization, selectUser } from '@proton/account';
import { isScribeSupported } from '@proton/components/helpers/assistant';
import { baseUseSelector } from '@proton/react-redux-store';
import { useFlag } from '@proton/unleash';

const useAssistantFeatureEnabled = () => {
    const accessToAssistant = useFlag('ComposerAssistant');

    const user = baseUseSelector(selectUser)?.value;

    const organization = baseUseSelector(selectOrganization)?.value;
    const organizationScribeEnabled =
        !!organization?.Settings.ShowScribeWritingAssistant || !!user?.isAdmin || !!user?.isFree;
    const planSupportsScribe = isScribeSupported(organization, user);

    const paymentsEnabled = accessToAssistant;

    const enabled =
        accessToAssistant &&
        // user can't enter scribe trial if the organization plan doesn't support it
        planSupportsScribe &&
        // If org admin disabled scribe to sub users, do not show the feature
        organizationScribeEnabled;

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
        enabled: enabled,
    };
};

export default useAssistantFeatureEnabled;
