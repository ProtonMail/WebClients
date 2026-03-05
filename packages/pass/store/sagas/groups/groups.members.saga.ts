import { getGroupMembers as fetchGroupMembers } from '@proton/pass/lib/groups/groups.requests';
import { getGroupMembers } from '@proton/pass/store/actions/creators/groups';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: getGroupMembers,
    call: fetchGroupMembers,
});
