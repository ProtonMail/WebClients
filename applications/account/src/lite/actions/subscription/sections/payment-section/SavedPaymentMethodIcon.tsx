import { getCreditCardTypeByBrand } from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type {
    SavedCardDetails,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
} from '@proton/payments/core/interface';
import { getBankSvg } from '@proton/payments/ui';

import type { SavedMethodCustomType } from './SavedPaymentMethodDetails';
import sepaBankIcon from './payment-method-icons/bank-transfer.svg';

interface Props {
    savedMethod: SavedPaymentMethodInternal | SavedPaymentMethodExternal | undefined;
}

const SavedPaymentMethodIcon = ({ savedMethod }: Props) => {
    const type = savedMethod?.Type as SavedMethodCustomType;
    if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        const { Brand } = savedMethod?.Details as SavedCardDetails;
        const bankIcon = getBankSvg(getCreditCardTypeByBrand(Brand));
        return <img width="32" src={bankIcon} alt={Brand} />;
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        const bankIcon = getBankSvg('paypal');
        return <img width="32" src={bankIcon} alt={'PayPal'} />;
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
        return <img width="32" src={sepaBankIcon} alt={'SEPA Bank transfer'} />;
    }
};

export default SavedPaymentMethodIcon;
