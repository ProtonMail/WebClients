import { fork, put, select, takeEvery } from 'redux-saga/effects';

import identity from '@proton/utils/identity';

import { clientBooted, clientOffline } from '../../../lib/client';
import { filterDeletedTabIds } from '../../../lib/extension/utils/tabs';
import { SyncStrategy } from '../../../lib/sync/types';
import type { TabId } from '../../../types';
import { clientInit, getUserAccessIntent, secureLinksGet, stateHydrate } from '../../actions';
import { garbageCollectTabState } from '../../actions/creators/filters';
import { passwordHistoryGarbageCollect } from '../../actions/creators/password';
import { forcePollV2 } from '../../actions/creators/polling';
import type { WithReceiverAction } from '../../actions/enhancers/endpoint';
import { withRevalidate } from '../../request/enhancers';
import { selectSyncStrategy, selectTabIDs } from '../../selectors';
import type { RootSagaOptions, State } from '../../types';

function* clientInitWorker(
    { getAuthStore: getAuth }: RootSagaOptions,
    { payload: { status }, meta }: WithReceiverAction<ReturnType<typeof clientInit.intent>>
) {
    const { tabId, endpoint } = meta.receiver;
    const loggedIn = getAuth().hasSession();
    const userId = getAuth().getUserID();
    const strategy: SyncStrategy = yield select(selectSyncStrategy);

    if (endpoint === 'popup' || endpoint === 'page') {
        const state: State = yield select();
        yield put(stateHydrate(state, { endpoint, tabId }));
    }

    if (loggedIn && userId && clientBooted(status)) {
        const online = !clientOffline(status);
        const isPopup = endpoint === 'popup';
        const maybeRevalidate = isPopup ? withRevalidate : identity;

        switch (strategy) {
            case SyncStrategy.LEGACY:
                if (online) yield put(maybeRevalidate(getUserAccessIntent(userId)));
                break;
            case SyncStrategy.USER_EVENTS:
                /** Force an immediate V2 poll on popup wakeup to
                 * ensure fresh data without explicit revalidation */
                if (online && isPopup) yield put(forcePollV2());
                break;
        }

        /* garbage collect any stale popup tab
         * state on each popup wakeup call */
        if (endpoint === 'popup') {
            if (online) yield put(secureLinksGet.intent());
            yield put(passwordHistoryGarbageCollect());

            yield fork(function* () {
                const tabIds: TabId[] = yield select(selectTabIDs);
                const deletedTabIds: TabId[] = yield filterDeletedTabIds(tabIds);
                yield put(garbageCollectTabState({ tabIds: deletedTabIds }));
            });
        }
    }

    yield put(clientInit.success(meta.request.id, { endpoint, tabId }));
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeEvery(clientInit.intent.match, clientInitWorker, options);
}
