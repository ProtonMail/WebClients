import { put } from 'redux-saga/effects';

import { enableAliasSync } from '@proton/pass/lib/alias/alias.requests';
import { aliasSyncEnable } from '@proton/pass/store/actions';
import { userAccessRequest } from '@proton/pass/store/actions/requests';
import { requestInvalidate } from '@proton/pass/store/request/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

/* Will invalidate the `user-access` request as to re-request it
 * from the event channels soon as possible. */
export default createRequestSaga({
    actions: aliasSyncEnable,
    call: function* (DefaultShareID, { getAuthStore }) {
        yield enableAliasSync({ DefaultShareID });
        yield put(requestInvalidate(userAccessRequest(getAuthStore().getUserID()!)));

        return true;
    },
});
