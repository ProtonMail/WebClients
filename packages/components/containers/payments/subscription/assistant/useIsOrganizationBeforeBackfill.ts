import { selectOrganization } from '@proton/account';
import { baseUseSelector } from '@proton/react-redux-store';
import { PLANS_WITH_AI_INCLUDED } from '@proton/shared/lib/helpers/subscription';

export const useIsOrganizationBeforeBackfill = () => {
    const organization = baseUseSelector(selectOrganization)?.value;

    return !!organization && PLANS_WITH_AI_INCLUDED.includes(organization.PlanName) && organization.MaxAI === 0;
};
