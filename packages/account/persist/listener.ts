import type { SharedStartListening } from '@proton/redux-shared-store-types';
import {
    getPersistedSessions,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { isSubUser } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { serverEvent } from '../eventLoop';
import type { UserState } from '../user';
import { selectUser } from '../user';
import { deleteStore, pruneStores } from './db';
import { setEncryptedPersistedState } from './helper';

const PERSIST_THROTTLE = 2.5 * SECOND;

const isVisible = () => {
    return document.visibilityState === 'visible';
};

export const startPersistListener = <T extends UserState>(
    startListening: SharedStartListening<T>,
    transformState: (state: T) => string
) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const hasChange = currentState !== previousState;

            return isVisible() && hasChange;
        },
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            // Disable if session isn't "remember me"
            if (!listenerApi.extra.authentication.getPersistent()) {
                return;
            }

            const run = () => {
                const { authentication, config, eventManager } = listenerApi.extra;

                // Event manager is slightly delayed in bootstrap due to event ID. Refactor that to allow it to get created without ID.
                if (!eventManager || !isVisible()) {
                    return;
                }

                const state = listenerApi.getState();

                const eventID = eventManager.getEventID();
                const clientKey = authentication.getClientKey();
                const user = selectUser(state)?.value;
                const userID = user?.ID;

                if (!eventID || !clientKey || !state || !userID || isSubUser(user)) {
                    return;
                }

                const transformedState = transformState(state);

                setEncryptedPersistedState({
                    state: transformedState,
                    eventID,
                    clientKey,
                    userID,
                    config,
                }).catch(noop);
            };

            setTimeout(() => {
                run();
                listenerApi.subscribe();
            }, PERSIST_THROTTLE); // Throttled
        },
    });

    startListening({
        predicate: (action) => {
            return serverEvent.match(action) && action.payload.Refresh === EVENT_ERRORS.ALL;
        },
        effect: async (action, listenerApi) => {
            const state = listenerApi.getState();
            const userID = selectUser(state)?.value?.ID;
            if (!userID) {
                return;
            }
            listenerApi.unsubscribe();
            await deleteStore(userID).catch(noop);
            window.location.reload();
        },
    });

    startListening({
        predicate: () => {
            return isVisible();
        },
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            const run = () => {
                if (!isVisible()) {
                    return;
                }
                const sessions = getPersistedSessions();
                pruneStores(sessions.map((session) => session.UserID)).catch(noop);
            };

            run();
        },
    });
};

export const startLogoutListener = () => {
    registerSessionRemovalListener((persistedSession) => {
        return deleteStore(persistedSession.UserID).catch(noop);
    });
};
