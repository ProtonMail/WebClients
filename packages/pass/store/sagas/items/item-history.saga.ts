import { cancelled, put, takeLatest } from 'redux-saga/effects';

import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { getItemRevisions } from '@proton/pass/lib/items/item.requests';
import {
    itemHistoryAbort,
    itemHistoryFailure,
    itemHistoryIntent,
    itemHistorySuccess,
} from '@proton/pass/store/actions';
import type { ItemRevision, ItemRevisionListResponse } from '@proton/pass/types';

function* loadHistoryWorker({ payload, meta: { request } }: ReturnType<typeof itemHistoryIntent>): Generator {
    const ctrl = new AbortController();

    try {
        const result = (yield getItemRevisions(payload, ctrl.signal)) as ItemRevisionListResponse;
        const { RevisionsData, LastToken, Total } = result;
        const revisions = (yield Promise.all(
            RevisionsData.map((revision) => parseItemRevision(payload.shareId, revision))
        )) as ItemRevision[];

        yield put(
            itemHistorySuccess(request.id, {
                revisions,
                next: LastToken,
                total: Total,
                since: payload.since,
            })
        );
    } catch (error) {
        yield put(itemHistoryFailure(request.id, error));
    } finally {
        if (yield cancelled()) {
            yield put(itemHistoryAbort(request.id));
            ctrl.abort();
        }
    }
}

export default function* watcher() {
    yield takeLatest(itemHistoryIntent.match, loadHistoryWorker);
}
