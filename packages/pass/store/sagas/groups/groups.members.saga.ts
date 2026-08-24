import { getGroupMembers as fetchGroupMembers } from '../../../lib/groups/groups.requests';
import { getGroupMembers } from '../../actions/creators/groups';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: getGroupMembers,
    call: fetchGroupMembers,
});
