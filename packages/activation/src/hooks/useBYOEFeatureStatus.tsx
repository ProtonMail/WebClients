import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { getCanSeeBYOE } from '../helpers/byoeAccess.ts';

const useBYOEFeatureStatus = () => {
    const [user, loadingUser] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const isBYOEFeatureEnabled = useFlag('InboxBringYourOwnEmail');

    const userCanSeeBYOE = !loadingEntitlements && getCanSeeBYOE({ user, entitlements });

    const isByoeEnabled = isBYOEFeatureEnabled && userCanSeeBYOE;
    const loading = loadingEntitlements || loadingUser;
    return [isByoeEnabled, loading] as const;
};

export default useBYOEFeatureStatus;
