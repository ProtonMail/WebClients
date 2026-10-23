import { c } from 'ttag';

import Bordered from '@proton/components/components/container/Bordered';
import { IcBrandPaypal } from '@proton/icons/icons/IcBrandPaypal';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PayPalDetails } from '@proton/payments/core/interface';
import { getBankSvg } from '@proton/payments/core/payment-methods/credit-card-icons';
import { isPaypalDetails } from '@proton/payments/core/type-guards';

import type { PaymentMethodUi } from '../paymentMethodUi';

const SavedPaypalDetailsView = ({ details }: { details: PayPalDetails }) => {
    const { Payer } = details;

    const bankIcon = getBankSvg('paypal');

    return (
        <Bordered className="p-7 rounded" data-testid="existing-paypal">
            <div>
                <img width="70" src={bankIcon} alt="PayPal" className="mb-4" />
            </div>
            <div className="flex flex-wrap items-center">
                <label className="shrink-0 mr-4" htmlFor="paypal-payer">{c('Label').t`Payer`}</label>
                <code id="paypal-payer" className="block text-xl mb-0 text-ellipsis" title={Payer}>
                    {Payer}
                </code>
            </div>
        </Bordered>
    );
};

export const paypalPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL> = {
    newMethodView: () => ({
        icon: IcBrandPaypal,
        text: c('Payment method option').t`PayPal`,
    }),
    savedMethodIcon: () => IcBrandPaypal,
    savedMethodLabel: ({ PayerID }) => `PayPal - ${PayerID}`,
    renderSavedMethodTableCell: ({ Payer }) => (
        <>
            <span className="mr-2 align-middle" data-testid="payment-method">
                PayPal
            </span>
            <span
                className="block lg:inline-block align-middle text-ellipsis max-w-full"
                data-testid="payer"
                title={Payer}
            >
                {Payer}
            </span>
        </>
    ),
    renderSavedMethodDetails: (details) =>
        isPaypalDetails(details) ? <SavedPaypalDetailsView details={details} /> : null,
};
