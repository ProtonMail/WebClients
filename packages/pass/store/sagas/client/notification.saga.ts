import type { Action } from 'redux';
import { takeEvery } from 'redux-saga/effects';

import { clientOfflineUnlocked } from '@proton/pass/lib/client';
import type { WithNotification } from '@proton/pass/store/actions/enhancers/notification';
import { isActionWithNotification } from '@proton/pass/store/actions/enhancers/notification';
import { isActionWithRequest } from '@proton/pass/store/request/utils';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* notificationWorker({ onNotification, getAppState }: RootSagaOptions, action: WithNotification<Action>) {
    const { notification } = action.meta;

    /* discard notifications that should not be shown when offline */
    if (clientOfflineUnlocked(getAppState().status) && notification.offline === false) return;

    /* if the action has request metadata - use the
     * request id as the notification key in order to
     * correctly de-duplicate them */
    if (isActionWithRequest(action)) {
        notification.deduplicate = true;
        notification.key = notification.key ?? action.meta.request.id;
    }

    if (notification.loading) notification.expiration = -1;

    onNotification?.(notification);
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(isActionWithNotification, notificationWorker, options);
}
