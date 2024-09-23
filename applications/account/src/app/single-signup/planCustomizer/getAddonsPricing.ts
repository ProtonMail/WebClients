import type { ADDON_NAMES } from '@proton/shared/lib/constants';
import { AddonKey, AddonLimit } from '@proton/shared/lib/constants';
import { getSupportedAddons } from '@proton/shared/lib/helpers/addons';
import { getAddonMultiplier, getMaxValue, getPlanMaxIPs } from '@proton/shared/lib/helpers/subscription';
import type { Cycle, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

export default function getAddonsPricing({
    currentPlan,
    plansMap,
    planIDs,
    cycle,
    showGatewaysForBundlePlan,
}: {
    currentPlan: Plan;
    plansMap: { [key: string]: Plan };
    planIDs: PlanIDs;
    cycle: Cycle;
    showGatewaysForBundlePlan: boolean;
}) {
    const supportedAddons = getSupportedAddons(planIDs, { showGatewaysForBundlePlan });

    return Object.entries(supportedAddons)
        .map(([addonName]) => {
            const addon = plansMap[addonName];

            if (!addon) {
                return;
            }

            const addonNameKey = addon.Name as ADDON_NAMES;
            const quantity = planIDs[addon.Name] ?? 0;

            const isSupported = !!supportedAddons[addonNameKey];
            const addonMaxKey = AddonKey[addonNameKey];

            const addonMultiplier = getAddonMultiplier(addonMaxKey, addon);

            // The same workaround as above
            const min: number = getMaxValue(currentPlan, addonMaxKey);

            const max = AddonLimit[addonNameKey] * addonMultiplier;
            // Member addon comes with MaxSpace + MaxAddresses
            const value = isSupported
                ? min + quantity * addonMultiplier
                : Object.entries(planIDs).reduce((acc, [planName, quantity]) => {
                      // and the same workaround as above
                      let multiplier: number;
                      if (addonMaxKey === 'MaxIPs') {
                          multiplier = getPlanMaxIPs(plansMap[planName]);
                      } else {
                          multiplier = getMaxValue(plansMap[planName], addonMaxKey);
                      }

                      return acc + quantity * multiplier;
                  }, 0);

            const addonPricePerCycle = addon.Pricing[cycle] || 0;

            if (!value) {
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
