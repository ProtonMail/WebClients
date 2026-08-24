import { rejectGroupInvite } from '../../../lib/invites/invite.requests';
import { groupInviteReject } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: groupInviteReject,
    call: async (payload) => {
        await rejectGroupInvite(payload);
        return payload;
    },
});
