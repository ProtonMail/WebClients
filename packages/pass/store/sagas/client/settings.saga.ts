import { put, select, takeEvery } from 'redux-saga/effects';

import { settingsEditFailure, settingsEditIntent, settingsEditSuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import { isSettingsAction } from '@proton/pass/store/actions/enhancers/settings';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* settingsEditWorker(
    { onLocaleUpdated, onBetaUpdated }: RootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof settingsEditIntent>>
) {
    try {
        const settings: ProxiedSettings = yield select(selectProxiedSettings);
        /* `disallowedDomains` update should act as a setter */
        if ('disallowedDomains' in payload) settings.disallowedDomains = {};
        if (payload.locale) onLocaleUpdated?.(payload.locale);

        yield put(settingsEditSuccess(meta.request.id, payload, meta.silent, meta.sender?.endpoint));
        if ('beta' in payload) yield onBetaUpdated?.(payload.beta ?? false);
    } catch (e) {
        yield put(settingsEditFailure(meta.request.id, e, meta.sender?.endpoint));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(settingsEditIntent.match, settingsEditWorker, options);
    yield takeEvery(isSettingsAction, function* () {
        const settings: ProxiedSettings = yield select(selectProxiedSettings);
        yield options.onSettingsUpdated?.(settings);
    });
}
