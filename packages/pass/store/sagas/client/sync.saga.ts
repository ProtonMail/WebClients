import { call, put, race, select, take } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';
import type { User } from '@proton/shared/lib/interfaces';

import { sync } from '../../../lib/sync/sync';
import { SyncStrategy } from '../../../lib/sync/types';
import type { MaybeNull } from '../../../types';
import { logger } from '../../../utils/logger';
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
} from '../../actions';
import { resolveModelRegistry } from '../../actions/creators/model-registry';
import { getOrganizationPauseList, getOrganizationSettings } from '../../actions/creators/organization';
import { resolvePrivateDomains } from '../../actions/creators/private-domains';
import { resolveWebsiteRules } from '../../actions/creators/rules';
import { getAuthDevices } from '../../actions/creators/sso';
import { withRevalidate } from '../../request/enhancers';
import { selectSyncStrategy, selectUser } from '../../selectors';
import type { RootSagaOptions, State } from '../../types';
import { refreshUserData } from '../events/core/channel.core';

function* syncWorker(options: RootSagaOptions) {
    yield put(stopEventPolling());

    const user: MaybeNull<User> = yield select(selectUser);
    if (!user) return;

    const syncStrategy: SyncStrategy = yield select(selectSyncStrategy);
    const legacySync = syncStrategy === SyncStrategy.LEGACY;

    try {
        yield wait(1_500);

        /** Refresh user data (addresses + keys) before syncing */
        try {
            const keyPassword = options.getAuthStore().getPassword();
            if (keyPassword) yield call(refreshUserData, options.extensionId, keyPassword);
        } catch (err) {
            logger.warn('[Saga::Sync] user data refresh failed', err);
        }

        if (legacySync) {
            /** In V2 mode these are covered by user events:
             *  - user access: `UserRefreshed`
             *  - org settings: `OrganizationInfoChanged` */
            yield put(withRevalidate(getUserAccessIntent(user.ID)));
            yield put(withRevalidate(getOrganizationSettings.intent()));
        }

        yield put(withRevalidate(getUserFeaturesIntent(user.ID)));
        yield put(withRevalidate(secureLinksGet.intent()));
        yield put(withRevalidate(getInAppNotifications.intent()));
        yield put(getAuthDevices.intent());

        if (EXTENSION_BUILD) {
            yield put(withRevalidate(resolveWebsiteRules.intent()));
            yield put(withRevalidate(resolvePrivateDomains.intent()));
            yield put(withRevalidate(resolveModelRegistry.intent()));
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
