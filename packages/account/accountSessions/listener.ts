import { getAccountSessions } from '@proton/account/accountSessions/accountSessions';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { CacheType, getIsStaleRefetch, isExpired } from '@proton/redux-utilities';
import { DAY } from '@proton/shared/lib/constants';

import { bootstrapEvent } from '../bootstrap/action';
import { accountSessionsEvent } from './events';
import { type AccountSessionsState, accountSessionsSlice, selectAccountSessions } from './slice';

export const startAccountSessionsListener = (startListening: SharedStartListening<AccountSessionsState>) => {
    startListening({
        predicate: (action) => {
            return bootstrapEvent.match(action) || accountSessionsEvent.match(action);
        },
        effect: async (_, listenerApi) => {
            const state = selectAccountSessions(listenerApi.getState());

            if (state.meta.loading) {
                return;
            }

            if (!listenerApi.extra.unleashClient.isEnabled('AccountSessions')) {
                listenerApi.dispatch(accountSessionsSlice.actions.disabled());
                return;
            }

            const cache = {
                value: state.value,
                support: state.meta.support,
            };

            if (
                isExpired(state.meta.fetchedAt, 1 * DAY) ||
                getIsStaleRefetch(state.meta.fetchedEphemeral, CacheType.StaleRefetch)
            ) {
                // Reset cached sessions so that it's re-fetched
                cache.value = [];
            }

            const result = getAccountSessions({
                api: listenerApi.extra.api,
                cache,
            });

            if (!result.support) {
                listenerApi.dispatch(accountSessionsSlice.actions.disabled());
                return;
            }

            if (result.promise) {
                try {
                    listenerApi.dispatch(accountSessionsSlice.actions.loading(true));

                    const sessions = await result.promise;

                    listenerApi.dispatch(
                        accountSessionsSlice.actions.success({
                            sessions,
                            localID: listenerApi.extra.authentication.localID,
                            support: result.support,
                        })
                    );
                } finally {
                    listenerApi.dispatch(accountSessionsSlice.actions.loading(false));
                }
            }
        },
    });
};
