import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getCreditCardTypeByBrand } from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import { formattedShortSavedSepaDetails } from '@proton/components/payments/client-extensions';
import { IcBank } from '@proton/icons/icons/IcBank';
import { getBankSvg } from '@proton/payments-ui/ui/helpers/credit-card-icons';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type {
    PayPalDetails,
    SavedCardDetails,
    SavedMethodDetails,
    SavedMethodType,
    SepaDetails,
} from '@proton/payments/core/interface';
import { isPaypalDetails, isSavedCardDetails, isSepaDetails } from '@proton/payments/core/type-guards';

interface Props {
    type: SavedMethodType;
    details: SavedMethodDetails;
}

const CardRow = ({ details: { Brand, ExpMonth, ExpYear, Last4 } }: { details: SavedCardDetails }) => {
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
};

const PaypalRow = ({ details: { Payer } }: { details: PayPalDetails }) => {
    const bankIcon = getBankSvg('paypal');
    return (
        <div className="flex gap-3 items-center">
            {bankIcon ? <img width="48" src={bankIcon} alt={'PayPal'} /> : null}
            <div className="flex flex-column">
                <strong className="text-semibold">{Payer}</strong>
            </div>
        </div>
    );
};

const SepaRow = ({ details }: { details: SepaDetails }) => {
    const formattedIBAN = formattedShortSavedSepaDetails(details);
    return (
        <div className="flex gap-3 items-center flex-nowrap">
            <IcBank size={12} className="shrink-0" />
            <div className="flex flex-column">
                <strong className="text-semibold">{c('Label').t`Account holder: ${details.AccountName}`}</strong>
                <span className="text-sm color-weak">{c('Info').t`IBAN: ${formattedIBAN}`}</span>
            </div>
        </div>
    );
};

const renderByType: Partial<Record<SavedMethodType, (details: SavedMethodDetails) => ReactNode>> = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: (details) =>
        isSavedCardDetails(details) ? <CardRow details={details} /> : null,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: (details) =>
        isPaypalDetails(details) ? <PaypalRow details={details} /> : null,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: (details) =>
        isSepaDetails(details) ? <SepaRow details={details} /> : null,
};

const SavedPaymentMethodDetails = ({ type, details }: Props) => renderByType[type]?.(details) ?? null;

export default SavedPaymentMethodDetails;
