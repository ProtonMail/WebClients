import { resendVerificationCustomEmail } from '../../../lib/monitor/monitor.request';
import { resendVerificationCode } from '../../actions';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({ actions: resendVerificationCode, call: resendVerificationCustomEmail });
