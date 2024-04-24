import { verifyCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { verifyCustomAddress } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({
    actions: verifyCustomAddress,
    call: ({ emailId, code: Code }) => verifyCustomEmail(emailId, { Code }),
});
