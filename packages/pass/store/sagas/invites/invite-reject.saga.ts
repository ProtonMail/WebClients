import { select } from 'redux-saga/effects';

import { rejectInvite } from '@proton/pass/lib/invites/invite.requests';
import { createTelemetryEvent } from '@proton/pass/lib/telemetry/utils';
import { inviteReject } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';
import { selectInviteByToken } from '@proton/pass/store/selectors/invites';
import type { RootSagaOptions } from '@proton/pass/store/types';
import { type Invite, type Maybe, ShareType } from '@proton/pass/types';
import { TelemetryEventName, TelemetryTargetType } from '@proton/pass/types/data/telemetry';

export default createRequestSaga({
    actions: inviteReject,
    call: function* (payload, { getTelemetry }: RootSagaOptions) {
        const invite: Maybe<Invite> = yield select(selectInviteByToken(payload.inviteToken));

        yield rejectInvite(payload);

        const telemetry = getTelemetry();
        const type = invite?.targetType === ShareType.Item ? TelemetryTargetType.item : TelemetryTargetType.vault;
        void telemetry?.push(createTelemetryEvent(TelemetryEventName.PassInviteReject, {}, { type, extensionBrowser: BUILD_TARGET }));
        return payload;
    },
});
