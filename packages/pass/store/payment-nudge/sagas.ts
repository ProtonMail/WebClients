import { getPaymentMethods } from '@proton/payments/core/api/api';

import { api } from '../../lib/api/api';
import { createRequestSaga } from '../request/sagas';
import type { PassSaga } from '../types';
import { getPaymentNudgePaymentMethods } from './actions';

const paymentMethodsSaga = createRequestSaga({
    actions: getPaymentNudgePaymentMethods,
    call: () => getPaymentMethods(api),
});

export default [paymentMethodsSaga] satisfies PassSaga[];
