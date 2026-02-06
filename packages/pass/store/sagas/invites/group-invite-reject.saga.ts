import { rejectGroupInvite } from '@proton/pass/lib/invites/invite.requests';
import { groupInviteReject } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: groupInviteReject,
    call: async (payload) => {
        await rejectGroupInvite(payload);
        return payload;
    },
});
