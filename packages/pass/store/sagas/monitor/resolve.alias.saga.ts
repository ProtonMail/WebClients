import { put } from 'redux-saga/effects';

import { setBreachedAliasResolved } from '@proton/pass/lib/monitor/monitor.request';
import { getAliasBreach, resolveAliasBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: resolveAliasBreach,
    call: function* (item) {
        yield setBreachedAliasResolved(item.shareId, item.itemId);
        yield put(getAliasBreach.intent(item));
        return item;
    },
});
