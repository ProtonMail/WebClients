import type { UnknownAction } from '@reduxjs/toolkit';

import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { isDocumentVisible } from '@proton/shared/lib/helpers/dom';
import { CommonFeatureFlag } from '@proton/unleash/Flags';
import noop from '@proton/utils/noop';

import { type OffersDeliveryState, campaignThunk } from './slice';

/** Whatever action the host dispatches once its store is ready to make
 * authenticated requests — `bootstrapEvent` from `@proton/account` in every
 * Proton app today. Passed in rather than imported so this package keeps no
 * dependency on the account package, and so a host with a different notion of
 * "ready" can say so. Structural on purpose: anything with `match` fits,
 * including any `createAction` result. */
export type OffersDeliveryTrigger = {
    match: (action: UnknownAction) => boolean;
};

/** Revalidates once the host is ready and again on tab focus; the slice's
 * expiry decides whether either reaches the network. A backgrounded tab stops
 * asking.
 *
 * This is a listener rather than a component effect so the fetch and the
 * `visibilitychange` subscription exist exactly once per store by construction,
 * instead of once per correctly-placed provider. It also means revalidation no
 * longer depends on any part of the app's React tree being mounted. */
export const startOffersDeliveryListener = (
    startListening: SharedStartListening<OffersDeliveryState>,
    { appReady }: { appReady: OffersDeliveryTrigger }
) => {
    startListening({
        predicate: (action) => appReady.match(action),
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            const { unleashClient } = listenerApi.extra;
            const isEnabled = () => unleashClient?.isEnabled(CommonFeatureFlag.CentralisedOffersDelivery) ?? false;

            /* Checked here and not left to the thunk's own guard: `rejected`
             * stamps `meta.fetchedAt` exactly like `fulfilled` does, so
             * dispatching into a disabled flag would cache the throw for the
             * whole expiry window. */
            const revalidate = () => {
                if (isEnabled()) {
                    void listenerApi.dispatch(campaignThunk()).catch(noop);
                }
            };

            revalidate();

            document.addEventListener('visibilitychange', () => {
                if (isDocumentVisible()) {
                    revalidate();
                }
            });

            /* Unleash can flip live mid-session. A component effect got this for
             * free by listing the flag as a dependency; here nothing is
             * subscribed to it, so subscribe explicitly. `update` fires for
             * every toggle refresh, hence the transition check. */
            let enabled = isEnabled();
            unleashClient?.on('update', () => {
                const next = isEnabled();
                if (next && !enabled) {
                    revalidate();
                }
                enabled = next;
            });
        },
    });
};
