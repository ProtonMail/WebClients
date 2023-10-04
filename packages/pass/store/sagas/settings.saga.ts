import { put, select, takeLeading } from 'redux-saga/effects';

import { partialMerge } from '@proton/pass/utils/object';

import { settingsEditFailure, settingsEditIntent, settingsEditSuccess } from '../actions/creators/settings';
import type { WithSenderAction } from '../actions/with-receiver';
import type { ProxiedSettings } from '../reducers/settings';
import { selectProxiedSettings } from '../selectors/settings';
import type { WorkerRootSagaOptions } from '../types';

function* settingsEditWorker(
    { onSettingUpdate }: WorkerRootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof settingsEditIntent>>
) {
    try {
        const settings: ProxiedSettings = yield select(selectProxiedSettings);
        /* `disallowedDomains` update should act as a setter */
        if ('disallowedDomains' in payload) settings.disallowedDomains = {};

        yield onSettingUpdate?.(partialMerge(settings, payload));
        yield put(settingsEditSuccess(meta.request.id, payload, meta.sender?.endpoint));
    } catch (e) {
        yield put(settingsEditFailure(meta.request.id, e, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(settingsEditIntent.match, settingsEditWorker, options);
}
