import { put } from 'redux-saga/effects';

import { setBreachedCustomEmailResolved } from '@proton/pass/lib/monitor/monitor.request';
import { getCustomBreach, resolveCustomBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: resolveCustomBreach,
    call: function* (addressId) {
        yield setBreachedCustomEmailResolved(addressId);
        yield put(getCustomBreach.intent(addressId));
        return addressId;
    },
});
