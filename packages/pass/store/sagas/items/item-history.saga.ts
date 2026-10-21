import { cancelled, put, select, takeLatest } from 'redux-saga/effects';

import { parseItemRevision } from '../../../lib/items/item.parser';
import { hasHadAttachments } from '../../../lib/items/item.predicates';
import { getItemRevisions } from '../../../lib/items/item.requests';
import type { ItemRevisionListResponse } from '../../../types/api/pass';
import type { ItemRevision } from '../../../types/data/items';
import { filesResolve } from '../../actions/creators/files';
import { itemHistoryFailure, itemHistoryIntent, itemHistorySuccess } from '../../actions/creators/item';
import { requestInvalidate } from '../../request/actions';
import { withRevalidate } from '../../request/enhancers';
import { selectItem } from '../../selectors/items';

function* loadHistoryWorker({ payload, meta: { request } }: ReturnType<typeof itemHistoryIntent>): Generator {
    const ctrl = new AbortController();

    try {
        const item: ItemRevision = yield select(selectItem(payload.shareId, payload.itemId));
        const result: ItemRevisionListResponse = yield getItemRevisions(payload, ctrl.signal);

        if (hasHadAttachments(item)) {
            yield put(
                withRevalidate(
                    filesResolve.intent({
                        shareId: item.shareId,
                        itemId: item.itemId,
                        folderId: item.folderId,
                        history: true,
                    })
                )
            );
        }

        const { RevisionsData, LastToken, Total } = result;
        const revisions = (yield Promise.all(
            RevisionsData.map((revision) => parseItemRevision(payload.shareId, revision))
        )) as ItemRevision[];

        yield put(itemHistorySuccess(request.id, { revisions, next: LastToken, total: Total, since: payload.since }));
    } catch (error) {
        yield put(itemHistoryFailure(request.id, error));
    } finally {
        if (yield cancelled()) {
            ctrl.abort();
            yield put(requestInvalidate(request.id));
        }
    }
}

export default function* watcher() {
    yield takeLatest(itemHistoryIntent.match, loadHistoryWorker);
}
