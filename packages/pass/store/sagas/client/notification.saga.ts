import type { AnyAction } from 'redux';
import { takeEvery } from 'redux-saga/effects';

import type { WithNotification } from '@proton/pass/store/actions/with-notification';
import { isActionWithNotification } from '@proton/pass/store/actions/with-notification';
import { isActionWithRequest } from '@proton/pass/store/actions/with-request';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* notificationWorker({ onNotification }: WorkerRootSagaOptions, action: WithNotification<AnyAction>) {
    const { notification } = action.meta;

    /* if the action has request metadata - use the
     * request id as the notification key in order to
     * correctly de-duplicate them */
    if (isActionWithRequest(action)) {
        notification.deduplicate = true;
        notification.key = action.meta.request.id;
    }

    onNotification?.(notification);
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(isActionWithNotification, notificationWorker, options);
}
