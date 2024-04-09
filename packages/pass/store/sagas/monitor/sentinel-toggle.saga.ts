import { put, takeLeading } from 'redux-saga/effects';

import { sentinelToggle } from '@proton/pass/lib/monitor/monitor.request';
import { sentinelToggleFailure, sentinelToggleIntent, sentinelToggleSuccess } from '@proton/pass/store/actions';

function* sentinelToggleWorker({ meta, payload }: ReturnType<typeof sentinelToggleIntent>) {
    try {
        yield sentinelToggle(payload.value);
        yield put(sentinelToggleSuccess(meta.request.id, payload.value));
    } catch (error: unknown) {
        yield put(sentinelToggleFailure(meta.request.id, error));
    }
}

export default function* watcher() {
    yield takeLeading(sentinelToggleIntent.match, sentinelToggleWorker);
}
