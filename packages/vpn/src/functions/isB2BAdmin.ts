import {
    type MaybeFreeSubscription,
    getHasVpnB2BPlan,
    hasAnyB2bBundle,
} from '@proton/payments/core/subscription/helpers';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';

export const isB2BAdmin = ({
    user,
    organization,
    subscription,
}: {
    user: UserModel;
    organization?: OrganizationExtended;
    subscription: MaybeFreeSubscription;
}) => {
    const isAdmin = user.isAdmin && user.isSelf;
    const canHaveOrganization = !user.isMember && !!organization && isAdmin;

    return canHaveOrganization && (getHasVpnB2BPlan(subscription) || hasAnyB2bBundle(subscription));
};
