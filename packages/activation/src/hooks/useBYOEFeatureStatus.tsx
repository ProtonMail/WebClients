import { useUser } from '@proton/account/user/hooks';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

const useBYOEFeatureStatus = () => {
    const [user] = useUser();
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
    const userHasBYOEAccount = getIsBYOEAccount(user);
    const BYOEFeatureEnabled = clientFeatureEnabled || (killSwitchEnabled && userHasBYOEAccount);

    // Only admins can access to BYOE for now, this will change later
    return BYOEFeatureEnabled && isAdmin(user);
};

export default useBYOEFeatureStatus;
