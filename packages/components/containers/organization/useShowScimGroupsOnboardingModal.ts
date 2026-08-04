import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { getIsPassB2BPlan, getIsVpnB2BPlan } from '@proton/payments/core/plan/helpers';
import { useFlag } from '@proton/unleash/useFlag';

export const useShowScimGroupsOnboardingModal = () => {
    const isUserGroupsScimGroupsEnabled = useFlag('UserGroupsScimGroups');
    const [{ isAdmin }] = useUser();
    const [organization] = useOrganization();

    // Only the admins of the plans where SCIM group syncing is available are announced the feature.
    // The plan is derived from the organization rather than the subscription, because the subscription
    // is only fetched for paying admins and non-payer admins would otherwise be left out.
    const planName = organization?.PlanName;
    const hasVpnOrPassB2BPlan = !!planName && (getIsVpnB2BPlan(planName) || getIsPassB2BPlan(planName));

    const isEligible = isUserGroupsScimGroupsEnabled && isAdmin && !!organization?.IsScimEnabled && hasVpnOrPassB2BPlan;

    const { feature, loading } = useFeature<boolean>(FeatureCode.ScimGroupsOnboardingModal);

    return isEligible && !loading && feature?.Value === false;
};
