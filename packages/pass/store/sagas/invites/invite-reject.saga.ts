import { rejectInvite } from '@proton/pass/lib/invites/invite.requests';
import { inviteReject } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: inviteReject,
    call: async (payload) => {
        await rejectInvite(payload);
        return payload;
    },
});
