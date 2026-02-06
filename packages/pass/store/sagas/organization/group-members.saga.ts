import { getGroupMembers } from '@proton/pass/lib/organization/organization.requests';
import { groupMembers } from '@proton/pass/store/actions/creators/organization';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: groupMembers,
    call: function* loadGroupMembersWorker(payload) {
        return yield getGroupMembers(payload);
    },
});
