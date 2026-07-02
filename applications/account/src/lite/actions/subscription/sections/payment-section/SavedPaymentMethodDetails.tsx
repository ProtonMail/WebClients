import { c } from 'ttag';

import { getCreditCardTypeByBrand } from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import { formattedShortSavedSepaDetails } from '@proton/components/payments/client-extensions';
import { IcBank } from '@proton/icons/icons/IcBank';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PayPalDetails, SavedCardDetails, SepaDetails } from '@proton/payments/core/interface';
import { getBankSvg } from '@proton/payments/ui';

export type SavedMethodCustomType =
    | PAYMENT_METHOD_TYPES.CARD
    | PAYMENT_METHOD_TYPES.PAYPAL
    | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
    | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
    | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
    | PAYMENT_METHOD_TYPES.GOOGLE_PAY;

interface Props {
    type: SavedMethodCustomType;
    details: SavedCardDetails | PayPalDetails | SepaDetails;
}

const SavedPaymentMethodDetails = ({ type, details }: Props) => {
    if (type === PAYMENT_METHOD_TYPES.CARD || type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        const { Brand, ExpMonth, ExpYear, Last4 } = details as SavedCardDetails;
        const bankIcon = getBankSvg(getCreditCardTypeByBrand(Brand));
        return (
            <div className="flex gap-3 items-center">
                {bankIcon ? <img width="48" src={bankIcon} alt={Brand} /> : null}
                <div className="flex flex-column">
                    <strong className="text-semibold">{c('Label').t`${Brand} ending with ${Last4}`}</strong>
                    <span className="text-sm color-weak">{c('Info').t`Expires on ${ExpMonth}/${ExpYear}`}</span>
                </div>
            </div>
        );
    } else if (type === PAYMENT_METHOD_TYPES.PAYPAL || type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        const { Payer } = details as PayPalDetails;
        const bankIcon = getBankSvg('paypal');
        return (
            <div className="flex gap-3 items-center">
                {bankIcon ? <img width="48" src={bankIcon} alt={'PayPal'} /> : null}
                <div className="flex flex-column">
                    <strong className="text-semibold">{Payer}</strong>
                </div>
            </div>
        );
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
        const sepaDetails = details as SepaDetails;
        const formattedIBAN = formattedShortSavedSepaDetails(sepaDetails);
        return (
            <div className="flex gap-3 items-center flex-nowrap">
                <IcBank size={12} className="shrink-0" />
                <div className="flex flex-column">
                    <strong className="text-semibold">{c('Label')
                        .t`Account holder: ${sepaDetails.AccountName}`}</strong>
                    <span className="text-sm color-weak">{c('Info').t`IBAN: ${formattedIBAN}`}</span>
                </div>
            </div>
        );
    }
    return null;
};

export default SavedPaymentMethodDetails;
