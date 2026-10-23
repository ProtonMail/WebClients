import { getSavedMethodUi } from '@proton/payments-ui/payment-methods/paymentMethodUiRegistry';
import type { SavedMethodDetails, SavedMethodType } from '@proton/payments/core/interface';

interface Props {
    type: SavedMethodType;
    details: SavedMethodDetails;
}

const PaymentMethodDetails = ({ type, details }: Props) =>
    getSavedMethodUi(type)?.renderSavedMethodDetails?.(details) ?? null;

export default PaymentMethodDetails;
