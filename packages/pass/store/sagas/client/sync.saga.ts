import { call, put, race, select, take } from 'redux-saga/effects';

import { sync } from '@proton/pass/lib/events/sync';
import {
    getInAppNotifications,
    getUserAccessIntent,
    getUserFeaturesIntent,
    secureLinksGet,
    startEventPolling,
    stateDestroy,
    stopEventPolling,
    syncFailure,
    syncIntent,
    syncSuccess,
} from '@proton/pass/store/actions';
import { getOrganizationPauseList, getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { resolvePrivateDomains } from '@proton/pass/store/actions/creators/private-domains';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import { getAuthDevices } from '@proton/pass/store/actions/creators/sso';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { selectUser } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { User } from '@proton/shared/lib/interfaces';

function* syncWorker(options: RootSagaOptions) {
    yield put(stopEventPolling());

    const user: MaybeNull<User> = yield select(selectUser);
    if (!user) return;

    try {
        yield wait(1_500);

        yield put(withRevalidate(getUserAccessIntent(user.ID)));
        yield put(withRevalidate(getUserFeaturesIntent(user.ID)));
        yield put(withRevalidate(getOrganizationSettings.intent()));
        yield put(withRevalidate(secureLinksGet.intent()));
        yield put(withRevalidate(getInAppNotifications.intent()));
        yield put(getAuthDevices.intent());

        if (EXTENSION_BUILD) {
            yield put(withRevalidate(resolveWebsiteRules.intent()));
            yield put(withRevalidate(resolvePrivateDomains.intent()));
            yield put(withRevalidate(getOrganizationPauseList.intent()));
        }

        const state = (yield select()) as State;
        yield put(syncSuccess(yield call(sync, state, options)));
    } catch (e: unknown) {
        yield put(syncFailure(e));
    } finally {
        yield put(startEventPolling());
    }
}

/* The `syncWorker` function can take a long time to complete. In order to avoid conflicts
 * with any state resetting actions, we race the `sync` against such actions. */
export default function* watcher(options: RootSagaOptions): Generator {
    while (true) {
        yield call(function* () {
            yield take(syncIntent.match);
            yield race({
                sync: call(syncWorker, options),
                cancel: take(stateDestroy.match),
            });
        });
    }
}
