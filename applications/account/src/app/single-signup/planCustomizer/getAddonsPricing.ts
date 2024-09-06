import type { ADDON_NAMES } from '@proton/shared/lib/constants';
import { AddonKey, AddonLimit } from '@proton/shared/lib/constants';
import { getSupportedAddons } from '@proton/shared/lib/helpers/addons';
import { getMaxValue, getPlanMaxIPs } from '@proton/shared/lib/helpers/subscription';
import type { Cycle, Plan, PlanIDs } from '@proton/shared/lib/interfaces';
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

            /**
             * Workaround specifically for MaxIPs property. There is an upcoming migration in payments API v5
             * That will structure all these Max* properties in a different way.
             * For now, we need to handle MaxIPs separately.
             * See {@link MaxKeys} and {@link Plan}. Note that all properties from MaxKeys must be present in Plan
             * with the exception of MaxIPs.
             */
            let addonMultiplier: number;
            if (addonMaxKey === 'MaxIPs') {
                addonMultiplier = getPlanMaxIPs(addon);
                if (addonMultiplier === 0) {
                    addonMultiplier = 1;
                }
            } else {
                addonMultiplier = getMaxValue(addon, addonMaxKey) ?? 1;
            }

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
