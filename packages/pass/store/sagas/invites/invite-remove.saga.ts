import { put, select, takeEvery } from 'redux-saga/effects';

import { removeInvite } from '../../../lib/invites/invite.requests';
import { createTelemetryEvent } from '../../../lib/telemetry/utils';
import type { ItemRevision, Maybe } from '../../../types';
import { TelemetryEventName, TelemetryItemType, TelemetryTargetType } from '../../../types/data/telemetry';
import { inviteRemoveFailure, inviteRemoveIntent, inviteRemoveSuccess } from '../../actions';
import { syncAccess } from '../../actions/creators/polling';
import { selectItem } from '../../selectors';
import type { RootSagaOptions } from '../../types';

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
