import { put } from 'redux-saga/effects';

import { setBreachedProtonAddressResolved } from '@proton/pass/lib/monitor/monitor.request';
import { getProtonBreach, resolveProtonBreach } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: resolveProtonBreach,
    call: function* (addressId) {
        yield setBreachedProtonAddressResolved(addressId);
        yield put(getProtonBreach.intent(addressId));
        return addressId;
    },
});
