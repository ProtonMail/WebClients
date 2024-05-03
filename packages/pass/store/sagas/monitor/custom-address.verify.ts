import { verifyCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { intoCustomMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { verifyCustomAddress } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: verifyCustomAddress,
    call: ({ addressId, code: Code }) => verifyCustomEmail(addressId, { Code }).then(intoCustomMonitorAddress),
});
