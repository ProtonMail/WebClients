import { getHasInboxB2BPlan, getHasMemberCapablePlan } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';

import { ImportProvider } from '../interface';

export const isProviderSupported = (provider: ImportProvider) => {
    return provider === ImportProvider.GOOGLE;
};

export const isOrganizationOLESEligible = ({
    organization,
    subscription,
}: {
    organization: Organization | undefined;
    subscription: MaybeFreeSubscription;
}) => {
    return (
        !!organization &&
        !!subscription &&
        hasOrganizationSetupWithKeys(organization) &&
        organization?.State === ORGANIZATION_STATE.ACTIVE &&
        getHasMemberCapablePlan(organization, subscription) &&
        getHasInboxB2BPlan(subscription) &&
        isOrganizationB2B(organization)
    );
};

export const isUserOLESEligible = ({
    user,
    organization,
    subscription,
}: {
    user: UserModel | undefined;
    organization: Organization | undefined;
    subscription: MaybeFreeSubscription;
}) => {
    return Boolean(isOrganizationOLESEligible({ organization, subscription }) && user?.isSelf && user?.isAdmin);
};
