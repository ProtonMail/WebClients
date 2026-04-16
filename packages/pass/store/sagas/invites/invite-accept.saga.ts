import { END, eventChannel } from 'redux-saga';
import { put, select, take, takeEvery } from 'redux-saga/effects';
import { c } from 'ttag';

import { acceptInvite } from '@proton/pass/lib/invites/invite.requests';
import { requestItemsForShareId } from '@proton/pass/lib/items/item.requests';
import { parseShareResponse } from '@proton/pass/lib/shares/share.parser';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { inviteAccept, startEventPolling, stopEventPolling } from '@proton/pass/store/actions';
import { requestProgress } from '@proton/pass/store/request/actions';
import type { RequestProgress } from '@proton/pass/store/request/types';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { type Invite, type ItemRevision, type Maybe, type Share, type ShareGetResponse, ShareType } from '@proton/pass/types';
import { TelemetryEventName, TelemetryItemType, TelemetryTargetType } from '@proton/pass/types/data/telemetry';
import noop from '@proton/utils/noop';

type AcceptInviteChannel = RequestProgress<ItemRevision[], null>;

function* acceptInviteWorker(options: RootSagaOptions, action: ReturnType<typeof inviteAccept.intent>) {
    const telemetry = options.getTelemetry();
    const {
        payload,
        meta: { request },
    } = action;
    const requestId = request.id;
    const { inviteToken } = payload;

    try {
        yield put(stopEventPolling());

        const invite: Maybe<Invite> = yield select(selectInviteByToken(inviteToken));
        if (!invite) throw new Error(c('Error').t`Unknown invite`);

        const encryptedShare: ShareGetResponse = yield acceptInvite(payload, invite.keys);
        const share: Maybe<Share> = yield parseShareResponse(encryptedShare);
        if (!share) throw new Error(c('Error').t`Could not open invited vault`);

        const progressChannel = eventChannel<AcceptInviteChannel>((emitter) => {
            requestItemsForShareId(share.shareId, (progress) => emitter({ type: 'progress', progress, data: null }))
                .then((result) => emitter({ type: 'done', result }))
                .catch((error) => emitter({ type: 'error', error }))
                .finally(() => emitter(END));

            return noop;
        });

        while (true) {
            const action: AcceptInviteChannel = yield take(progressChannel);
            if (action.type === 'progress') yield put(requestProgress(requestId, action.progress));
            if (action.type === 'error') throw action.error;
            if (action.type === 'done') {
                const items = action.result;
                yield put(inviteAccept.success(requestId, { inviteToken, share, items }));
                options.onItemsUpdated?.();
                const dimensions =
                    invite.targetType === ShareType.Item && items[0]
                        ? {
                              type: TelemetryTargetType.item as const,
                              itemType: TelemetryItemType[items[0].data.type],
                              extensionBrowser: BUILD_TARGET,
                          }
                        : { type: TelemetryTargetType.vault as const, extensionBrowser: BUILD_TARGET };
                void telemetry?.push(createTelemetryEvent(TelemetryEventName.PassInviteAccept, {}, dimensions));
            }
        }
    } catch (err) {
        yield put(inviteAccept.failure(requestId, err));
    } finally {
        yield put(startEventPolling());
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(inviteAccept.intent.match, acceptInviteWorker, options);
}
