import { getHasMemberCapablePlan } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';

export const isOLESEligible = ({
    user,
    organization,
    subscription,
}: {
    user: UserModel | undefined;
    organization: Organization | undefined;
    subscription: MaybeFreeSubscription;
}) => {
    return (
        !!organization &&
        !!user &&
        !!subscription &&
        user.isAdmin &&
        user.isSelf &&
        hasOrganizationSetupWithKeys(organization) &&
        organization?.State === ORGANIZATION_STATE.ACTIVE &&
        getHasMemberCapablePlan(organization, subscription) &&
        isOrganizationB2B(organization)
    );
};
