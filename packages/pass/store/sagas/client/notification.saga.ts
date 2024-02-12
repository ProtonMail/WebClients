import type { Action } from 'redux';
import { takeEvery } from 'redux-saga/effects';

import type { WithNotification } from '@proton/pass/store/actions/enhancers/notification';
import { isActionWithNotification } from '@proton/pass/store/actions/enhancers/notification';
import { isActionWithRequest } from '@proton/pass/store/actions/enhancers/request';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* notificationWorker({ onNotification }: RootSagaOptions, action: WithNotification<Action>) {
    const { notification } = action.meta;

    /* if the action has request metadata - use the
     * request id as the notification key in order to
     * correctly de-duplicate them */
    if (isActionWithRequest(action)) {
        notification.deduplicate = true;
        notification.key = notification.key ?? action.meta.request.id;
    }

    onNotification?.(notification);
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(isActionWithNotification, notificationWorker, options);
}
