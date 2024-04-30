import { monitorCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { addCustomAddress } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: addCustomAddress,
    call: (Email) => monitorCustomEmail({ Email }),
});
