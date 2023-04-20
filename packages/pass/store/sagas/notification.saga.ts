import { AnyAction } from 'redux';
import { takeEvery } from 'redux-saga/effects';

import { WithNotification, isActionWithNotification } from '../actions/with-notification';
import { WorkerRootSagaOptions } from '../types';

function* notificationWorker({ onNotification }: WorkerRootSagaOptions, action: WithNotification<AnyAction>) {
    const { notification } = action.meta;
    onNotification?.(notification);
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(isActionWithNotification, notificationWorker, options);
}
