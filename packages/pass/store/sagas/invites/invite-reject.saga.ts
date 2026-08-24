import { select } from 'redux-saga/effects';

import { rejectInvite } from '../../../lib/invites/invite.requests';
import { createTelemetryEvent } from '../../../lib/telemetry/utils';
import { type Invite, type Maybe, ShareType } from '../../../types';
import { TelemetryEventName, TelemetryTargetType } from '../../../types/data/telemetry';
import { inviteReject } from '../../actions';
import { createRequestSaga } from '../../request/sagas';
import { selectInviteByToken } from '../../selectors/invites';
import type { RootSagaOptions } from '../../types';

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
