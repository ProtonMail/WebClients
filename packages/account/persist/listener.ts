import { isAnyOf } from '@reduxjs/toolkit';

import { coreEventLoopV6 } from '@proton/account/coreEventLoop';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import {
    getPersistedSessions,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { isDocumentVisible } from '@proton/shared/lib/helpers/dom';
import { isSelf } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { serverEvent } from '../eventLoop';
import type { UserState } from '../user';
import { selectUser } from '../user';
import { welcomeCompleted } from '../welcomeFlags/actions';
import { deleteStore, pruneStores } from './db';
import { removePersistedStateEvent } from './event';
import { setEncryptedPersistedState } from './helper';

const PERSIST_THROTTLE = 2.5 * SECOND;

export const startPersistListener = <T extends UserState>(
    startListening: SharedStartListening<T>,
    transformState: (state: T) => string
) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const hasChange = currentState !== previousState;

            return isDocumentVisible() && hasChange;
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
                if (!eventManager || !isDocumentVisible()) {
                    return;
                }

                const state = listenerApi.getState();

                const clientKey = authentication.getClientKey();
                const user = selectUser(state)?.value;
                const userID = user?.ID;

                if (!clientKey || !state || !userID || !isSelf(user)) {
                    return;
                }

                const transformedState = transformState(state);

                setEncryptedPersistedState({
                    state: transformedState,
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
        // Remove the previous store to ensure that the old welcome values in user settings isn't persisted
        matcher: isAnyOf(removePersistedStateEvent, welcomeCompleted),
        effect: async (action, listenerApi) => {
            const userID = selectUser(listenerApi.getState())?.value?.ID;
            if (userID) {
                await deleteStore(userID).catch(noop);
            }
        },
    });

    startListening({
        predicate: (action) => {
            return (
                (serverEvent.match(action) && action.payload.Refresh === EVENT_ERRORS.ALL) ||
                (coreEventLoopV6.match(action) && action.payload.event.Refresh)
            );
        },
        effect: async (action, listenerApi) => {
            const userID = selectUser(listenerApi.getState())?.value?.ID;
            if (userID) {
                listenerApi.unsubscribe();
                await deleteStore(userID).catch(noop);
                window.location.reload();
            }
        },
    });

    startListening({
        predicate: () => {
            return isDocumentVisible();
        },
        effect: async (action, listenerApi) => {
            listenerApi.unsubscribe();

            const run = () => {
                if (!isDocumentVisible()) {
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
