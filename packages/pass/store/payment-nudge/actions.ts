import type { SavedPaymentMethod } from '@proton/payments/core/interface';

import { UNIX_MINUTE } from '../../utils/time/constants';
import { dataRequest } from '../request/configs';
import { requestActionsFactory } from '../request/flow';

export const getPaymentNudgePaymentMethods = requestActionsFactory<void, SavedPaymentMethod[], void>('payment-nudge::payment-methods')({
    success: dataRequest(15 * UNIX_MINUTE),
});
