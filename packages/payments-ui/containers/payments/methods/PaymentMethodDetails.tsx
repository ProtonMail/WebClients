import type { SavedMethodDetails, SavedMethodType } from '@proton/payments/core/interface';

import { getSavedMethodUi } from '../../../payment-methods/paymentMethodUiRegistry';

interface Props {
    type: SavedMethodType;
    details: SavedMethodDetails;
}

const PaymentMethodDetails = ({ type, details }: Props) =>
    getSavedMethodUi(type)?.renderSavedMethodDetails?.(details) ?? null;

export default PaymentMethodDetails;
