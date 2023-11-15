import { put, takeLeading } from 'redux-saga/effects';

import {
    sessionLockDisableFailure,
    sessionLockDisableIntent,
    sessionLockDisableSuccess,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* disableSessionLockWorker(
    { getAuthService }: WorkerRootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof sessionLockDisableIntent>>
) {
    try {
        yield getAuthService().deleteLock(payload.pin);
        yield put(sessionLockDisableSuccess(meta.request.id, meta.sender?.endpoint));
    } catch (error) {
        yield put(sessionLockDisableFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockDisableIntent.match, disableSessionLockWorker, options);
}
