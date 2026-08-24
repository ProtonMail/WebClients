import { put, select, takeLeading } from 'redux-saga/effects';

import type { User } from '@proton/shared/lib/interfaces';

import { hasAttachments } from '../../../lib/items/item.predicates';
import { SYNC_STRATEGY } from '../../../lib/sync/global';
import { SyncStrategy } from '../../../lib/sync/types';
import { getUserAccess } from '../../../lib/user/user.requests';
import type { MaybeNull } from '../../../types';
import { or } from '../../../utils/fp/predicates';
import {
    aliasPendingCreate,
    getUserAccessFailure,
    getUserAccessIntent,
    getUserAccessSuccess,
    importReport,
    itemCreate,
    itemDelete,
    itemDeleteRevisions,
    itemEdit,
    vaultDeleteSuccess,
} from '../../actions';
import type { HydratedAccessState } from '../../reducers';
import { withRevalidate } from '../../request/enhancers';
import { selectUser } from '../../selectors';
import type { RootSagaOptions } from '../../types';

function* userAccessWorker({ getAuthStore }: RootSagaOptions, { meta }: ReturnType<typeof getUserAccessIntent>) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLocked();
        const user: MaybeNull<User> = yield select(selectUser);
        if (!loggedIn || locked || !user) throw new Error('Cannot fetch user plan');

        const access: HydratedAccessState = yield getUserAccess();

        if (SYNC_STRATEGY === SyncStrategy.LEGACY) {
            /** Sync pending aliases from SimpleLogin. If we're in sync v2
             * we rely on the `PendingAliasToCreateChanged` user event. */
            const { aliasSyncEnabled, pendingAliasToSync } = access.userData;
            if (aliasSyncEnabled && pendingAliasToSync > 0) yield put(aliasPendingCreate.intent());
        }

        yield put(getUserAccessSuccess(meta.request.id, access));
    } catch (error) {
        yield put(getUserAccessFailure(meta.request.id, error));
    }
}

const matchRevalidateUserAccess = (action: unknown) => {
    if (importReport.match(action)) return true;
    if (itemDeleteRevisions.success.match(action)) return true;
    if (vaultDeleteSuccess.match(action)) return true;
    if (or(itemEdit.success.match, itemCreate.success.match)(action)) return hasAttachments(action.payload.item);
    if (itemDelete.success.match(action)) return action.payload.hadFiles;

    return false;
};

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getUserAccessIntent.match, userAccessWorker, options);

    /** Revalidates the user storage everytime files are linked */
    yield takeLeading(matchRevalidateUserAccess, function* () {
        const userID = options.getAuthStore().getUserID();
        if (userID) yield put(withRevalidate(getUserAccessIntent(userID)));
    });
}
