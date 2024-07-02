import { useOrganization, usePlans, useSubscription, useUser } from '@proton/components/hooks';
import { ADDON_NAMES, PLAN_TYPES } from '@proton/shared/lib/constants';
import { isScribeAddon } from '@proton/shared/lib/helpers/planIDs';
import { hasAIAssistant } from '@proton/shared/lib/helpers/subscription';
import { Renew } from '@proton/shared/lib/interfaces';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';

const useAssistantToggle = () => {
    const [user, userLoading] = useUser();
    const [plans, plansLoading] = usePlans();
    const [organization] = useOrganization();
    const [subscription, subscriptionLoading] = useSubscription();
    const addonPlan = plans?.plans.find((plan) => plan.Name === ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS);
    const isOrgAdmin = user.isAdmin && isOrganizationB2B(organization);
    const currentAddonSubscription = subscription?.Plans?.filter((plan) => {
        if (plan.Type === PLAN_TYPES.ADDON && isScribeAddon(plan.Name)) {
            return plan;
        }

        return null;
    }).filter(Boolean);

    const loading = userLoading || plansLoading || subscriptionLoading;

    const getMinimalAssistantPrice = () => {
        if (!addonPlan) {
            return 0;
        }

        const monthlyPrices = Object.entries(addonPlan.Pricing).map(([key, value]) => value / +key);
        return Math.min(...monthlyPrices);
    };

    return {
        loading,
        addonPlan,
        currentAddonSubscription,
        isOrgAdmin,
        isRenewalEnabled: subscription?.Renew === Renew.Enabled,
        hasBoughtPlan: hasAIAssistant(subscription),
        getMinimalAssistantPrice,
    };
};

export default useAssistantToggle;
