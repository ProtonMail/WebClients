import { put, takeEvery } from 'redux-saga/effects';

import { getAliasDetails } from '@proton/pass/lib/alias/alias.requests';
import { getAliasDetailsFailure, getAliasDetailsIntent, getAliasDetailsSuccess } from '@proton/pass/store/actions';
import type { AliasDetails } from '@proton/pass/types';

function* requestAliasDetails(action: ReturnType<typeof getAliasDetailsIntent>) {
    const {
        payload: { shareId, itemId, aliasEmail },
        meta: { request },
    } = action;
    try {
        const result: AliasDetails = yield getAliasDetails(shareId, itemId);
        yield put(getAliasDetailsSuccess(request.id, result));
    } catch (e) {
        yield put(getAliasDetailsFailure(request.id, { aliasEmail }, e));
    }
}

export default function* watcher() {
    yield takeEvery(getAliasDetailsIntent.match, requestAliasDetails);
}
