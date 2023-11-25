import { put, takeLeading } from 'redux-saga/effects';

import { signoutIntent, signoutSuccess } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* signoutIntentWorker({ getAuthService }: RootSagaOptions, action: ReturnType<typeof signoutIntent>) {
    yield getAuthService().logout({ soft: action.payload.soft });
    yield put(signoutSuccess(action.payload));
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(signoutIntent.match, signoutIntentWorker, options);
}
