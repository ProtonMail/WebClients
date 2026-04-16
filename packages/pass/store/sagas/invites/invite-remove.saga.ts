import { put, select, takeEvery } from 'redux-saga/effects';

import { removeInvite } from '@proton/pass/lib/invites/invite.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { inviteRemoveFailure, inviteRemoveIntent, inviteRemoveSuccess } from '@proton/pass/store/actions';
import { syncAccess } from '@proton/pass/store/actions/creators/polling';
import { selectItem } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision, Maybe } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType, TelemetryTargetType } from '@proton/pass/types/data/telemetry';

function* removeInviteWorker({ getTelemetry }: RootSagaOptions, { payload, meta: { request } }: ReturnType<typeof inviteRemoveIntent>) {
    try {
        yield removeInvite(payload);
        yield put(inviteRemoveSuccess(request.id, payload));
        yield put(syncAccess(payload));

        const telemetry = getTelemetry();
        const item: Maybe<ItemRevision> = payload.itemId ? yield select(selectItem(payload.shareId, payload.itemId)) : undefined;
        const dimensions = item
            ? { type: TelemetryTargetType.item as const, itemType: TelemetryItemType[item.data.type], extensionBrowser: BUILD_TARGET }
            : { type: TelemetryTargetType.vault as const, extensionBrowser: BUILD_TARGET };
        void telemetry?.push(createTelemetryEvent(TelemetryEventName.PassInviteDelete, {}, dimensions));
    } catch (err) {
        yield put(inviteRemoveFailure(request.id, err));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(inviteRemoveIntent.match, removeInviteWorker, options);
}
