import { put, takeLeading } from 'redux-saga/effects';

import { unlock } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* unlockWorker({ getAuthService }: RootSagaOptions, { payload, meta: { request } }: ReturnType<typeof unlock.intent>) {
    try {
        yield getAuthService().unlock(payload.mode, payload.secret, payload.offline);
        yield put(unlock.success(request.id, payload.mode));
    } catch (err: any) {
        yield put(unlock.failure(request.id, err, payload.mode));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(unlock.intent.match, unlockWorker, options);
}
