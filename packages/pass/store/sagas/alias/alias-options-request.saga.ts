import { put, takeEvery } from 'redux-saga/effects';

import { getAliasOptions } from '@proton/pass/lib/alias/alias.requests';
import { getAliasOptionsFailure, getAliasOptionsIntent, getAliasOptionsSuccess } from '@proton/pass/store/actions';
import type { AliasOptions } from '@proton/pass/types';

function* requestAliasOptions(action: ReturnType<typeof getAliasOptionsIntent>) {
    const {
        payload: { shareId },
        meta: { callback: onAliasOptionsIntentProcessed, request },
    } = action;

    try {
        const options: AliasOptions = yield getAliasOptions(shareId);
        const aliasOptionsSuccessAction = getAliasOptionsSuccess(request.id, { options });
        yield put(aliasOptionsSuccessAction);
        onAliasOptionsIntentProcessed?.(aliasOptionsSuccessAction);
    } catch (e) {
        const aliasOptionsFailureAction = getAliasOptionsFailure(request.id, e);
        yield put(aliasOptionsFailureAction);
        onAliasOptionsIntentProcessed?.(aliasOptionsFailureAction);
    }
}

export default function* watcher() {
    yield takeEvery(getAliasOptionsIntent.match, requestAliasOptions);
}
