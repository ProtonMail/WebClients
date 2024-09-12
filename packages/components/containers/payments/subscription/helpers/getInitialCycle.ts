import type { FullPlansMap } from '@proton/components/payments/core';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS, CYCLE, DEFAULT_CYCLE, type FreeSubscription, isFreeSubscription } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import type { Currency, Cycle, PlanIDs, SubscriptionModel } from '@proton/shared/lib/interfaces';

import { getAllowedCycles } from './getAllowedCycles';
import { notHigherThanAvailableOnBackend } from './payment';

export function getInitialCycle(
    cycleParam: Cycle | undefined,
    subscription: SubscriptionModel | FreeSubscription,
    planIDs: PlanIDs,
    plansMap: FullPlansMap,
    isPlanSelection: boolean,
    app: ProductParam,
    minimumCycle: Cycle | undefined,
    maximumCycle: Cycle | undefined,
    currency: Currency,
    allowDowncycling: boolean,
    defaultCycles: Cycle[] | undefined
): Cycle {
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

        /**
         * Users that are on the 15 or 30-month cycle should not default to that,
         * e.g. when clicking "explore other plans".
         * The condition also includes the cycle of upcoming subscription. The upcoming cycle must be
         * longer than the current cycle, according to the backend logic. That's why it takes precedence and the
         * frontend also considers it to be longer.
         * */
        const cycle =
            getNormalCycleFromCustomCycle(subscription.UpcomingSubscription?.Cycle) ??
            getNormalCycleFromCustomCycle(subscription?.Cycle) ??
            DEFAULT_CYCLE;

        return cycle;
    })();

    cycle = getNormalCycleFromCustomCycle(
        Math.max(
            cycle,
            subscription?.Cycle ?? Number.NEGATIVE_INFINITY,
            subscription?.UpcomingSubscription?.Cycle ?? Number.NEGATIVE_INFINITY
        )
    );
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

    if (!allowedCycles.includes(cycle)) {
        cycle = allowedCycles.at(0) ?? DEFAULT_CYCLE;
    }

    return cycle;
}
