import { resendVerificationCustomEmail } from '../../../lib/monitor/monitor.request';
import { resendVerificationCode } from '../../actions/creators/monitor';
import { createRequestSaga } from '../../request/sagas';

export default createRequestSaga({ actions: resendVerificationCode, call: resendVerificationCustomEmail });
