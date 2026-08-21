import { put } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { notification } from '@proton/pass/store/actions';
import { NotificationKey } from '@proton/pass/types/worker/notification';

export function* notifyInactiveShares() {
    if (PassCrypto.ready) {
        yield put(
            notification({
                endpoint: 'popup',
                type: 'error',
                expiration: 5_000,
                key: NotificationKey.INACTIVE_SHARES,
                text: '',
            })
        );
    }
}
