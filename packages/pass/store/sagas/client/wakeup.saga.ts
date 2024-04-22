import { fork, put, select, takeEvery } from 'redux-saga/effects';

import { clientBooted } from '@proton/pass/lib/client';
import { filterDeletedTabIds } from '@proton/pass/lib/extension/utils/tabs';
import { getUserAccessIntent, stateHydrate, wakeupIntent, wakeupSuccess } from '@proton/pass/store/actions';
import { passwordHistoryGarbageCollect } from '@proton/pass/store/actions/creators/password';
import { popupTabStateGarbageCollect } from '@proton/pass/store/actions/creators/popup';
import type { WithReceiverAction } from '@proton/pass/store/actions/enhancers/endpoint';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { selectPopupStateTabIds } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { TabId } from '@proton/pass/types';
import identity from '@proton/utils/identity';

function* wakeupWorker(
    { getAuthStore: getAuth }: RootSagaOptions,
    { payload: { status }, meta }: WithReceiverAction<ReturnType<typeof wakeupIntent>>
) {
    const { tabId, endpoint } = meta.receiver;
    const loggedIn = getAuth().hasSession();
    const userId = getAuth().getUserID();

    /* synchronise the target client app state */
    yield put(stateHydrate((yield select()) as State, { endpoint, tabId }));

    if (loggedIn && userId && clientBooted(status)) {
        const maybeRevalidate = endpoint === 'popup' ? withRevalidate : identity;
        yield put(maybeRevalidate(getUserAccessIntent(userId)));

        /* garbage collect any stale popup tab
         * state on each popup wakeup call */
        if (endpoint === 'popup') {
            yield put(passwordHistoryGarbageCollect());

            yield fork(function* () {
                const tabIds: TabId[] = yield select(selectPopupStateTabIds);
                const deletedTabIds: TabId[] = yield filterDeletedTabIds(tabIds);
                yield put(popupTabStateGarbageCollect({ tabIds: deletedTabIds }));
            });
        }
    }

    yield put(wakeupSuccess(meta.request.id, { endpoint, tabId }));
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeEvery(wakeupIntent.match, wakeupWorker, options);
}
