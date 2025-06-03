import { put, select, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { settingsEditFailure, settingsEditIntent, settingsEditSuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import { isSettingsAction } from '@proton/pass/store/actions/enhancers/settings';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { merge } from '@proton/pass/utils/object/merge';
import { updateLocale } from '@proton/shared/lib/api/settings';

function* settingsEditWorker(
    { onLocaleUpdated, onBetaUpdated, onSettingsUpdated }: RootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof settingsEditIntent>>
) {
    try {
        const prev: ProxiedSettings = yield select(selectProxiedSettings);
        if ('disallowedDomains' in payload) prev.disallowedDomains = {};
        const next = merge(prev, payload);

        yield onSettingsUpdated?.(next);

        if (payload.locale) {
            yield api(updateLocale(payload.locale));
            onLocaleUpdated?.(payload.locale);
        }

        if ('beta' in payload) yield onBetaUpdated?.(payload.beta ?? false);

        yield put(settingsEditSuccess(meta.request.id, next, meta.silent, meta.sender?.endpoint));
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
