import { resendVerificationCustomEmail } from '@proton/pass/lib/monitor/monitor.request';
import { resendVerificationCode } from '@proton/pass/store/actions';
import { createRequestSaga } from '@proton/pass/store/request/sagas';

export default createRequestSaga({ actions: resendVerificationCode, call: resendVerificationCustomEmail });
