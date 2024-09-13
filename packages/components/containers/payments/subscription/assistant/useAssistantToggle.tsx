import { useOrganization, usePreferredPlansMap, useSubscription, useUser } from '@proton/components/hooks';
import { type AmountAndCurrency } from '@proton/payments';
import { ADDON_NAMES, PLAN_TYPES } from '@proton/shared/lib/constants';
import { isScribeAddon } from '@proton/shared/lib/helpers/addons';
import { hasAIAssistant } from '@proton/shared/lib/helpers/subscription';
import { Renew } from '@proton/shared/lib/interfaces';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';

const useAssistantToggle = () => {
    const [user, userLoading] = useUser();
    const { plansMap, plansMapLoading, preferredCurrency } = usePreferredPlansMap();
    const [organization] = useOrganization();
    const [subscription, subscriptionLoading] = useSubscription();
    const addonPlan = plansMap?.[ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS];
    const isOrgAdmin = user.isAdmin && isOrganizationB2B(organization);
    const currentAddonSubscription = subscription?.Plans?.filter((plan) => {
        if (plan.Type === PLAN_TYPES.ADDON && isScribeAddon(plan.Name)) {
            return plan;
        }

        return null;
    }).filter(Boolean);

    const loading = userLoading || plansMapLoading || subscriptionLoading;

    const getMinimalAssistantPrice = (): AmountAndCurrency => {
        if (!addonPlan) {
            return { Amount: 0, Currency: preferredCurrency };
        }

        const monthlyPrices = Object.entries(addonPlan.Pricing).map(([key, value]) => value / +key);
        return {
            Amount: Math.min(...monthlyPrices),
            Currency: addonPlan.Currency,
        };
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
