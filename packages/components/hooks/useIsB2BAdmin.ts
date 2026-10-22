import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { isAdmin } from '@proton/shared/lib/user/helpers';

const useIsB2BAdmin = () => {
    const [user] = useUser();
    const [entitlements] = useEntitlementChecksForOrgAndUser();
    return isAdmin(user) && entitlements.isB2B;
};

export default useIsB2BAdmin;
