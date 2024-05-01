import { put } from 'redux-saga/effects';

import {
    setBreachedAliasResolved,
    setBreachedCustomEmailResolved,
    setBreachedProtonAddressResolved,
} from '@proton/pass/lib/monitor/monitor.request';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { getAliasBreach, getCustomBreach, getProtonBreach, resolveAddressMonitor } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: resolveAddressMonitor,
    call: function* (address) {
        switch (address.type) {
            case AddressType.ALIAS: {
                yield setBreachedAliasResolved(address.shareId, address.itemId);
                yield put(getAliasBreach.intent(address));
                return address;
            }

            case AddressType.CUSTOM: {
                yield setBreachedCustomEmailResolved(address.addressId);
                yield put(getCustomBreach.intent(address.addressId));
                return address;
            }

            case AddressType.PROTON: {
                yield setBreachedProtonAddressResolved(address.addressId);
                yield put(getProtonBreach.intent(address.addressId));
                return address;
            }
        }
    },
});
