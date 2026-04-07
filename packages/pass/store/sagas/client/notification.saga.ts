import type { Action } from 'redux';
import { takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { clientOffline } from '@proton/pass/lib/client';
import { isActionWithSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { WithNotification } from '@proton/pass/store/actions/enhancers/notification';
import { isActionWithNotification } from '@proton/pass/store/actions/enhancers/notification';
import { isActionWithRequest } from '@proton/pass/store/request/utils';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* notificationWorker({ onNotification, getAppState }: RootSagaOptions, action: WithNotification<Action>) {
    const { notification } = action.meta;

    const offline = clientOffline(getAppState().status);

    /* discard notifications that should not be shown when offline */
    if (offline && notification.offline === false) return;
    else if (offline && notification.type === 'error') notification.errorMessage = c('Warning').t`Offline`;

    if (isActionWithSender(action)) notification.endpoint = action.meta.sender?.endpoint;

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
