import { put, takeLeading } from 'redux-saga/effects';

import type { ItemRevision } from '@proton/pass/types';

import { itemsRequestFailure, itemsRequestSuccess, itemsRequested } from '../actions';
import { requestItemsForShareId } from './workers/items';

function* requestItems(action: ReturnType<typeof itemsRequested>) {
    const { shareId } = action.payload;
    try {
        const items = (yield requestItemsForShareId(shareId)) as ItemRevision[];
        yield put(itemsRequestSuccess({ shareId, items }));
    } catch (e) {
        yield put(itemsRequestFailure(e));
    }
}

export default function* watcher() {
    yield takeLeading(itemsRequested.match, requestItems);
}
