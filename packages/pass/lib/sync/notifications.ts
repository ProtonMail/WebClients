import { put } from 'redux-saga/effects';

import { notification } from '../../store/notifications/in-app/actions';
import { NotificationKey } from '../../types/worker/notification';
import { PassCrypto } from '../crypto';

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
