import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { defineContext } from '@proton/telemetry-tracker/lib/context';
import isTruthy from '@proton/utils/isTruthy';

/** Ambient dimensions of the Mail events, kept up to date by `store/trackerContextListener.ts` */
export const mailContext = defineContext({
    /**
     * Plans the user holds, sorted and joined with a comma (for example `bundle2022,pass2023`), `free` when none,
     * `unknown` until the subscriptions load so that a paid user is never reported as free.
     */
    plan: 'unknown',
});

export const getPlanDimension = (subscriptions: Subscription[]) => {
    const names = subscriptions.map((subscription) => getPlanName(subscription)).filter(isTruthy);
    return names.length ? Array.from(new Set(names)).sort().join(',') : 'free';
};
