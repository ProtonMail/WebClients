import type { FullPlansMap } from '@proton/payments';
import { type Currency, type FreeSubscription, type PlanIDs, isFreeSubscription } from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS, CYCLE, DEFAULT_CYCLE } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import type { Cycle, SubscriptionModel } from '@proton/shared/lib/interfaces';

import { getAllowedCycles } from './getAllowedCycles';
import { isSamePlanCheckout } from './isSamePlanCheckout';
import { notHigherThanAvailableOnBackend } from './payment';

interface GetInitialCycleParams {
    cycleParam: Cycle | undefined;
    subscription: SubscriptionModel | FreeSubscription;
    planIDs: PlanIDs;
    plansMap: FullPlansMap;
    isPlanSelection: boolean;
    app: ProductParam;
    minimumCycle: Cycle | undefined;
    maximumCycle: Cycle | undefined;
    currency: Currency;
    allowDowncycling: boolean;
    defaultCycles?: Cycle[];
}

export function getInitialCycle({
    cycleParam,
    subscription,
    planIDs,
    plansMap,
    isPlanSelection,
    app,
    minimumCycle,
    maximumCycle,
    currency,
    allowDowncycling,
    defaultCycles,
}: GetInitialCycleParams): Cycle {
    let cycle = (() => {
        if (isPlanSelection) {
            if (app === APPS.PROTONPASS) {
                return CYCLE.YEARLY;
            }
            if (cycleParam) {
                return cycleParam;
            }
            return DEFAULT_CYCLE;
        }

        if (cycleParam) {
            return cycleParam;
        }

        if (isFreeSubscription(subscription)) {
            return DEFAULT_CYCLE;
        }

        const cycle =
            getNormalCycleFromCustomCycle(subscription.UpcomingSubscription?.Cycle) ??
            getNormalCycleFromCustomCycle(subscription?.Cycle) ??
            DEFAULT_CYCLE;

        return cycle;
    })();

    if (isSamePlanCheckout(subscription, planIDs)) {
        cycle = getNormalCycleFromCustomCycle(
            Math.max(
                cycle,
                subscription?.Cycle ?? Number.NEGATIVE_INFINITY,
                subscription?.UpcomingSubscription?.Cycle ?? Number.NEGATIVE_INFINITY
            )
        );
    }
    cycle = notHigherThanAvailableOnBackend(planIDs, plansMap, cycle);

    const allowedCycles = getAllowedCycles({
        subscription,
        minimumCycle,
        maximumCycle,
        defaultCycles,
        currency,
        planIDs,
        plansMap,
        allowDowncycling,
    });

    // Respect the minimum cycle
    if (minimumCycle && cycle < minimumCycle) {
        cycle = minimumCycle;
    }

    // Respect the maximum cycle
    if (maximumCycle && cycle > maximumCycle) {
        cycle = maximumCycle;
    }

    if (!allowedCycles.includes(cycle)) {
        cycle = allowedCycles.at(0) ?? DEFAULT_CYCLE;
    }

    return cycle;
}
