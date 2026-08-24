import { fork, put, select, takeEvery } from 'redux-saga/effects';

import { updateLocale } from '@proton/shared/lib/api/settings';

import { api } from '../../../lib/api/api';
import { AppStatus } from '../../../types';
import { merge } from '../../../utils/object/merge';
import { getInAppNotifications, settingsEditFailure, settingsEditIntent, settingsEditSuccess } from '../../actions';
import type { WithSenderAction } from '../../actions/enhancers/endpoint';
import { isSettingsAction } from '../../actions/enhancers/settings';
import type { ProxiedSettings } from '../../reducers/settings';
import { withRevalidate } from '../../request/enhancers';
import { selectProxiedSettings } from '../../selectors';
import type { RootSagaOptions } from '../../types';

/** NOTE: Update in-app notifications translations. Add timeout so BE can get
 * the updated language before returning translated notifications */
function* setLocaleSetting(locale: string) {
    try {
        yield api(updateLocale(locale));
        yield put(withRevalidate(getInAppNotifications.intent()));
    } catch {}
}

function* settingsEditWorker(
    { onLocaleUpdated, onBetaUpdated }: RootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof settingsEditIntent>>
) {
    try {
        const prev: ProxiedSettings = yield select(selectProxiedSettings);
        if ('disallowedDomains' in payload) prev.disallowedDomains = {};
        const next = merge(prev, payload);

        if (payload.locale) {
            yield fork(setLocaleSetting, payload.locale);
            onLocaleUpdated?.(payload.locale);
        }

        yield put(settingsEditSuccess(meta.request.id, next, meta.silent, meta.sender?.endpoint));
        if ('beta' in payload) yield onBetaUpdated?.(payload.beta ?? false);
    } catch (e) {
        yield put(settingsEditFailure(meta.request.id, e, meta.sender?.endpoint));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(settingsEditIntent.match, settingsEditWorker, options);
    yield takeEvery(isSettingsAction, function* () {
        /** Guard against syncing settings to disk while the app is in a
         * "post-state-destroyed" state (locked/unauthorized/errored).
         * Any uncanceled & in-flight sagas dispatching a settings mutating
         * action could land after state has been destroyed causing corruption.
         * `BOOTING` state is whitelisted so legitimate writes during the boot
         * sequence still go through although the app isn't fully booted yet. */
        const { booted, status } = options.getAppState();
        if (!booted && status !== AppStatus.BOOTING) return;

        const settings: ProxiedSettings = yield select(selectProxiedSettings);
        yield options.onSettingsUpdated?.(settings);
    });
}
