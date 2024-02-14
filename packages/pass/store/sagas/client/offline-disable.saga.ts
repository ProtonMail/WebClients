import { takeLeading } from 'redux-saga/effects';

import { offlineDisable } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* offlineDisableWorker({ getAuthService, getAuthStore }: RootSagaOptions) {
    const auth = getAuthService();
    const authStore = getAuthStore();

    authStore.setOfflineConfig(undefined);
    authStore.setOfflineKD(undefined);
    yield auth.persistSession();
}

export default function* watcher(options: RootSagaOptions): Generator {
    yield takeLeading(offlineDisable.match, offlineDisableWorker, options);
}
