import {
    type ADDON_NAMES,
    ADDON_PREFIXES,
    AddonFeatureLimitKeyMapping,
    AddonLimit,
    type Cycle,
    type Plan,
    type PlanIDs,
    getAddonMultiplier,
    getPlanFeatureLimit,
    getSupportedAddons,
    isAddonType,
} from '@proton/payments';
import isTruthy from '@proton/utils/isTruthy';

export default function getAddonsPricing({
    currentPlan,
    plansMap,
    planIDs,
    cycle,
}: {
    currentPlan: Plan;
    plansMap: { [key: string]: Plan };
    planIDs: PlanIDs;
    cycle: Cycle;
}) {
    const supportedAddons = getSupportedAddons(planIDs);

    const supportedAddonNames = Object.keys(supportedAddons) as ADDON_NAMES[];

    const whitelistedAddonTypes: ADDON_PREFIXES[] = [ADDON_PREFIXES.MEMBER, ADDON_PREFIXES.IP];

    return supportedAddonNames
        .map((addonName) => {
            const addon = plansMap[addonName];
            if (!addon) {
                return;
            }

            const quantity = planIDs[addon.Name] ?? 0;

            const isSupported = !!supportedAddons[addonName];
            const featureLimitKey = AddonFeatureLimitKeyMapping[addonName];

            const addonMultiplier = getAddonMultiplier(featureLimitKey, addon);

            const min: number = getPlanFeatureLimit(currentPlan, featureLimitKey);

            const max = AddonLimit[addonName] * addonMultiplier;

            // Member addon comes with MaxSpace + MaxAddresses
            const value = isSupported
                ? min + quantity * addonMultiplier
                : Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
                      const multiplier: number = getPlanFeatureLimit(plansMap[planName], featureLimitKey);

                      return acc + quantity * multiplier;
                  }, 0);

            const addonPricePerCycle = addon.Pricing[cycle] || 0;

            const isAllowedAddonType = whitelistedAddonTypes.some((addonType) => isAddonType(addonName, addonType));
            if (!value && !isAllowedAddonType) {
                return;
            }

            return {
                addonPricePerCycle,
                cycle,
                value,
                min,
                max,
                addon,
                isSupported,
                addonMultiplier,
            };
        })
        .filter(isTruthy);
}
