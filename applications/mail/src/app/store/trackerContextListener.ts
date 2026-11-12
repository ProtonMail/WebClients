import { allSubscriptionsThunk, selectAllSubscriptions } from '@proton/account/allSubscriptions';
import noop from '@proton/utils/noop';

import { getPlanDimension, mailContext } from '../telemetry/context';
import type { AppStartListening } from './store';

type State = Parameters<typeof selectAllSubscriptions>[0];

const selectPlan = (state: State) => {
    const subscriptions = selectAllSubscriptions(state).value;
    return subscriptions ? getPlanDimension(subscriptions) : 'unknown';
};

/**
 * Keeps `mailContext` in sync with the store. The plan is only recomputed when the subscriptions change, or while
 * it is still the placeholder and the subscriptions are already there (restored from the persisted state at boot).
 */
export const startTrackerContextListener = (startListening: AppStartListening) => {
    startListening({
        predicate: (_, currentState, previousState) =>
            selectAllSubscriptions(currentState).value !== selectAllSubscriptions(previousState).value ||
            (mailContext.get('plan') === 'unknown' && selectAllSubscriptions(currentState).value !== undefined),
        effect: (_, listenerApi) => {
            mailContext.set({ plan: selectPlan(listenerApi.getState()) });
        },
    });

    // The removed `useAllSubscriptions()` also triggered the fetch: nothing else in Mail does, and the events of a
    // fresh signup (nothing persisted) would all carry `unknown`. The thunk reuses the cached value when there is one.
    startListening({
        predicate: () => true,
        effect: (_, listenerApi) => {
            listenerApi.unsubscribe();
            // A failed fetch leaves the plan on `unknown`, the intended fallback
            listenerApi.dispatch(allSubscriptionsThunk()).catch(noop);
        },
    });
};
