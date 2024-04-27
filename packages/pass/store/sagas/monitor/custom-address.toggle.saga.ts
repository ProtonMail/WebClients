import { toggleMonitorCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { intoCustomMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { toggleCustomAddress } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: toggleCustomAddress,
    call: ({ addressId, monitor: Monitor }) =>
        toggleMonitorCustomEmail(addressId, { Monitor }).then(intoCustomMonitorAddress),
});
