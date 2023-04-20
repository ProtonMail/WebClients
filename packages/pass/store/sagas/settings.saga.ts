import { put, select, takeLeading } from 'redux-saga/effects';

import { partialMerge } from '@proton/pass/utils/object';

import { settingEditFailure, settingEditIntent, settingEditSuccess } from '../actions/creators/settings';
import type { ProxiedSettings } from '../reducers/settings';
import { selectProxiedSettings } from '../selectors/settings';
import type { WorkerRootSagaOptions } from '../types';

function* disableSessionLockWorker(
    { onSettingUpdate }: WorkerRootSagaOptions,
    { meta, payload }: ReturnType<typeof settingEditIntent>
) {
    try {
        const settings: ProxiedSettings = yield select(selectProxiedSettings);
        yield onSettingUpdate?.(partialMerge(settings, payload));

        yield put(settingEditSuccess(payload, meta.receiver));
    } catch (e) {
        yield put(settingEditFailure(e, meta.receiver));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(settingEditIntent.match, disableSessionLockWorker, options);
}
