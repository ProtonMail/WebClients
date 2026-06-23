import { PLANS } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { Organization, UserModel } from '@proton/shared/lib/interfaces';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';

import { ImportProvider } from '../interface';

const hasSupportedPlan = (plan: PLANS) =>
    [PLANS.MAIL_BUSINESS, PLANS.MAIL_PRO, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025].includes(
        plan
    );

export const isProviderSupported = (provider: ImportProvider) => {
    return provider === ImportProvider.GOOGLE;
};

export const isOrganizationOLESEligible = ({ organization }: { organization: Organization | undefined }) => {
    return (
        !!organization &&
        hasSupportedPlan(organization.PlanName) &&
        hasOrganizationSetupWithKeys(organization) &&
        organization?.State === ORGANIZATION_STATE.ACTIVE &&
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
    return Boolean(isOrganizationOLESEligible({ organization }) && !!subscription && user?.isSelf && user?.isAdmin);
};
