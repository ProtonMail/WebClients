import { call, put, select, takeLatest } from 'redux-saga/effects';

import { dedupeShares } from '../../../lib/shares/share.dedupe';
import type { Share } from '../../../types';
import { sharesDedupeUpdate } from '../../actions';
import { isShareDedupeAction } from '../../actions/enhancers/dedupe';
import type { ShareDedupeState } from '../../reducers/shares-dedupe';
import { selectAllShares } from '../../selectors';
import type { RootSagaOptions } from '../../types';

function* dedupeWorker({ getCore }: RootSagaOptions) {
    const shares: Share[] = yield select(selectAllShares);
    const dedupeState: ShareDedupeState = yield call(dedupeShares, shares, getCore());
    yield put(sharesDedupeUpdate(dedupeState));
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(isShareDedupeAction, dedupeWorker, options);
}
