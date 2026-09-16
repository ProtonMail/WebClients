import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { isExpired } from '@proton/redux-utilities/fetchedAt';
import { CacheType } from '@proton/redux-utilities/interface';
import { getIsStaleRefetch } from '@proton/redux-utilities/promiseStore';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    cleanupInactivePersistedSessions,
    getMissingPersistedSessionsFromActiveSessions,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, DAY } from '@proton/shared/lib/constants';
import { isDocumentVisible } from '@proton/shared/lib/helpers/dom';
import noop from '@proton/utils/noop';

import { bootstrapEvent } from '../bootstrap/action';
import { getAccountSessions } from './accountSessions';
import { accountSessionsEvent } from './events';
import { cleanupOrphanedDuplicateSessions } from './orphanedSessions';
import { type AccountSessionsState, accountSessionsSlice, selectAccountSessions } from './slice';
import { updateAccountSessions } from './storage';

// Deferred so that it never competes with rendering.
const runWhenIdle = (run: () => void) => {
    const timeout = 1_000;
    if (globalThis.requestIdleCallback) {
        globalThis.requestIdleCallback(run, { timeout });
    } else {
        setTimeout(run, timeout);
    }
};

export const startAccountSessionsListener = (startListening: SharedStartListening<AccountSessionsState>) => {
    startListening({
        predicate: (action) => {
            return bootstrapEvent.match(action) || accountSessionsEvent.match(action);
        },
        effect: async (_, listenerApi) => {
            const state = selectAccountSessions(listenerApi.getState());

            const isStaleRefetch = getIsStaleRefetch(state.meta.fetchedEphemeral, CacheType.StaleRefetch);

            // Loading may have been persisted to storage while an update was happening. This ignores that in case it's a stale refetch.
            if (state.meta.loading && !isStaleRefetch) {
                return;
            }

            const cache = {
                value: state.value,
                support: state.meta.support,
            };

            if (isExpired(state.meta.fetchedAt, 1 * DAY) || isStaleRefetch) {
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

                    const { sessions, remoteSessions } = await result.promise;

                    listenerApi.dispatch(
                        accountSessionsSlice.actions.success({
                            sessions,
                            localID: listenerApi.extra.authentication.localID,
                            support: result.support,
                        })
                    );

                    // Only cleanup orphaned duplicate sessions on account because it is aware of the entire list of sessions
                    if (listenerApi.extra.config.APP_NAME === APPS.PROTONACCOUNT && isDocumentVisible()) {
                        runWhenIdle(() => {
                            cleanupOrphanedDuplicateSessions({
                                api: listenerApi.extra.api,
                                remoteSessions,
                                persistedSessions: getPersistedSessions(),
                            }).catch(noop);
                        });
                    }
                } finally {
                    listenerApi.dispatch(accountSessionsSlice.actions.loading(false));
                }
            }
        },
    });

    startListening({
        predicate: (action, currentState, previousState) => {
            return selectAccountSessions(currentState)?.value !== selectAccountSessions(previousState)?.value;
        },
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            if (!isDocumentVisible()) {
                return;
            }

            const activeSessions = selectAccountSessions(listenerApi.getState()).value;
            if (!activeSessions.length) {
                return;
            }

            const run = () => {
                const selfLocalID = listenerApi.extra.authentication.localID;
                const missingPersistedSessions = getMissingPersistedSessionsFromActiveSessions(
                    getPersistedSessions(),
                    activeSessions
                ).filter((x) => x.localID !== selfLocalID);

                cleanupInactivePersistedSessions({
                    api: getSilentApi(listenerApi.extra.api),
                    persistedSessions: missingPersistedSessions,
                }).catch(noop);
            };

            runWhenIdle(run);
        },
    });

    startListening({
        actionCreator: bootstrapEvent,
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            if (listenerApi.extra.config.APP_NAME === APPS.PROTONACCOUNT) {
                return;
            }

            const run = () => {
                // Rudimentary way of having a "primary" tab writing to avoid race conditions.
                if (!isDocumentVisible()) {
                    return;
                }
                updateAccountSessions();
            };

            runWhenIdle(run);
        },
    });
};
