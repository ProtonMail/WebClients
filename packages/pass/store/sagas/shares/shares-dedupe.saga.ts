import { call, put, select, takeLatest } from 'redux-saga/effects';

import { dedupeShares } from '../../../lib/shares/share.dedupe';
import type { Share } from '../../../types/data/shares';
import { sharesDedupeUpdate } from '../../actions/creators/share';
import { isShareDedupeAction } from '../../actions/enhancers/dedupe';
import type { ShareDedupeState } from '../../reducers/shares-dedupe';
import { selectAllShares } from '../../selectors/shares';
import type { RootSagaOptions } from '../../types';

function* dedupeWorker({ getCore }: RootSagaOptions) {
    const shares: Share[] = yield select(selectAllShares);
    const dedupeState: ShareDedupeState = yield call(dedupeShares, shares, getCore());
    yield put(sharesDedupeUpdate(dedupeState));
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(isShareDedupeAction, dedupeWorker, options);
}
