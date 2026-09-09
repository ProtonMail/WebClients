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
    SavedMethodType,
    SavedPaymentMethod,
    SepaDetails,
} from '@proton/payments/core/interface';

interface Props {
    method: SavedPaymentMethod;
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

const renderByType: {
    [T in SavedMethodType]?: (method: Extract<SavedPaymentMethod, { Type: T }>) => ReactNode;
} = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: (method) => <CardRow details={method.Details} />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: (method) => <PaypalRow details={method.Details} />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: (method) => <SepaRow details={method.Details} />,
};

const SavedPaymentMethodDetails = ({ method }: Props) => {
    // Type already discriminates Details, but TS won't carry that through the index access
    const renderMethod = renderByType[method.Type] as ((method: SavedPaymentMethod) => ReactNode) | undefined;

    return renderMethod?.(method) ?? null;
};

export default SavedPaymentMethodDetails;
