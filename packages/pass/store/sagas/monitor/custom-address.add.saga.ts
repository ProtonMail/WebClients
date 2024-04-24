import { monitorCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { monitorCustomAddress } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: monitorCustomAddress,
    call: (email) => monitorCustomEmail({ Email: email }),
});
