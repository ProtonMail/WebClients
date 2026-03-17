import { call, put, select, takeLatest } from 'redux-saga/effects';

import { dedupeShares } from '@proton/pass/lib/shares/share.dedupe';
import { sharesDedupeUpdate } from '@proton/pass/store/actions';
import { isShareDedupeAction } from '@proton/pass/store/actions/enhancers/dedupe';
import type { ShareDedupeState } from '@proton/pass/store/reducers/shares-dedupe';
import { selectAllShares } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Share } from '@proton/pass/types';

function* dedupeWorker({ getCore }: RootSagaOptions) {
    const shares: Share[] = yield select(selectAllShares);
    const dedupeState: ShareDedupeState = yield call(dedupeShares, shares, getCore());
    yield put(sharesDedupeUpdate(dedupeState));
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(isShareDedupeAction, dedupeWorker, options);
}
