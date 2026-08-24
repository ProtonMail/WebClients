import { verifyCustomEmail } from '../../../lib/monitor/monitor.request';
import { intoCustomMonitorAddress } from '../../../lib/monitor/monitor.utils';
import { verifyCustomAddress } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({
    actions: verifyCustomAddress,
    call: ({ addressId, code: Code }) => verifyCustomEmail(addressId, { Code }).then(intoCustomMonitorAddress),
});
