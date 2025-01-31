import type { FullPlansMap } from '@proton/payments';
import {
    CYCLE,
    type Currency,
    DEFAULT_CYCLE,
    type FreeSubscription,
    type PlanIDs,
    isFreeSubscription,
} from '@proton/payments';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { APPS } from '@proton/shared/lib/constants';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import type { Cycle, Subscription } from '@proton/shared/lib/interfaces';

import { getAllowedCycles, isSupportedCycle } from './getAllowedCycles';
import { isSamePlanCheckout } from './isSamePlanCheckout';
import { notHigherThanAvailableOnBackend } from './payment';

interface GetInitialCycleParams {
    cycleParam: Cycle | undefined;
    subscription: Subscription | FreeSubscription;
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
    if (cycleParam && isSupportedCycle({ cycle: cycleParam, planIDs, plansMap })) {
        return cycleParam;
    }

    let cycle = (() => {
        if (cycleParam) {
            return cycleParam;
        }

        if (isPlanSelection) {
            if (app === APPS.PROTONPASS) {
                return CYCLE.YEARLY;
            }

            return DEFAULT_CYCLE;
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

    // Respect the minimum cycle
    if (minimumCycle && cycle < minimumCycle) {
        cycle = minimumCycle;
    }
    // Respect the maximum cycle
    if (maximumCycle && cycle > maximumCycle) {
        cycle = maximumCycle;
    }

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
