import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getCanSeeBYOE } from '@proton/activation/src/helpers/byoeAccess.ts';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';
import { useFlag } from '@proton/unleash/useFlag';

const useBYOEFeatureStatus = (
    authorizeBYOEOnlyAccounts = true // In Settings, for example, we want to show BYOE options to BYOE only accounts. However, in the checklist, only normal accounts can see the option
) => {
    const [user, loadingUser] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const killSwitchEnabled = useFlag('InboxBringYourOwnEmail');
    const clientFeatureEnabled = useFlag('InboxBringYourOwnEmailClient');

    /*
     * The feature will be enabled with different experiments:
     * - Exp 1: See BYOE during signup -> Based on InboxBringYourOwnEmailSignup feature flag
     * - Exp 2: New signups see BYOE in checklist -> Based on InboxBringYourOwnEmailClient feature flag, targeting new user IDs
     * - Exp 3: Show BYOE to existing users -> Based on InboxBringYourOwnEmailClient feature flag, targeting old user IDs
     *
     * Note, both InboxBringYourOwnEmailSignup & InboxBringYourOwnEmailClient are children feature flags of InboxBringYourOwnEmail, that we use as a kill switch.
     * So disabling the kill switch will disable the 2 children feature flags too.
     *
     * So, only users having the client feature OR users who created an account using BYOE (and who have the BYOE account flag).
     * Of course, we need to make sure that the kill switch is ON to see the feature for BYOE accounts.
     */
    const getBYOEFeatureEnabled = () => {
        if (authorizeBYOEOnlyAccounts) {
            const userHasBYOEAccount = getIsBYOEAccount(user);
            return killSwitchEnabled && (clientFeatureEnabled || userHasBYOEAccount);
        }
        return killSwitchEnabled && clientFeatureEnabled;
    };

    const BYOEFeatureEnabled = getBYOEFeatureEnabled();

    const userCanSeeBYOE = getCanSeeBYOE(user, organization);

    return [BYOEFeatureEnabled && userCanSeeBYOE, loadingOrganization || loadingUser] as const;
};

export default useBYOEFeatureStatus;
