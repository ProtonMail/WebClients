import { c } from 'ttag';

import Bordered from '@proton/components/components/container/Bordered';
import { IcBank } from '@proton/icons/icons/IcBank';
import type { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedMethodDetails, SepaDetails } from '@proton/payments/core/interface';
import { isSepaDetails } from '@proton/payments/core/type-guards';

import { SepaAuthorizationText } from '../../ui/components/SepaAuthorizationText';
import { NBSP_HTML, maskedLast4 } from '../maskedLast4';
import type { PaymentMethodUi } from '../paymentMethodUi';

export function formattedShortSavedSepaDetails(details: SepaDetails): string {
    const { Country, Last4 } = details;

    return `${Country}${NBSP_HTML}${maskedLast4(Last4)}`;
}

export function formattedSavedSepaDetails(details: SepaDetails): string {
    const iban = formattedShortSavedSepaDetails(details);
    return `IBAN${NBSP_HTML}${iban}`;
}

export const getBankTransferLabel = (details: SepaDetails): string => {
    const iban = formattedSavedSepaDetails(details);

    // translator: for example "Bank transfer - IBAN •••• 0000"
    return c('Payments.Saved payment method details').t`Bank transfer - ${iban}`;
};

export const renderBankAccountTableCell = (details: SepaDetails) => (
    <>
        <span className="mr-2 align-middle" data-testid="sepa-payment-method">
            {c('Payment Method').t`Bank Account`}
        </span>
        <span className="block lg:inline-block align-middle text-ellipsis max-w-full" data-testid="sepa-details">
            {formattedSavedSepaDetails(details)}
        </span>
    </>
);

const SavedSepaDetailsView = ({ details }: { details: SavedMethodDetails }) => {
    // no matter what the shape of the details, we MUST display the authorization text. This is a protective measure
    // in case if isSepaDetails fails in the future.
    if (!isSepaDetails(details)) {
        return <SepaAuthorizationText />;
    }

    return (
        <>
            <Bordered className="p-7 rounded" data-testid="existing-sepa">
                <div className="flex flex-wrap">
                    <div className="flex-1 mr-4">
                        <span className="block mb-2 opacity-40">{c('Label').t`Account holder`}</span>
                        <span className="text-xl my-0 inline-block text-ellipsis max-w-full">
                            {details.AccountName}
                        </span>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="block mb-2 opacity-40">{c('Label').t`IBAN`}</span>
                        <span className="text-xl my-0">{formattedShortSavedSepaDetails(details)}</span>
                    </div>
                </div>
            </Bordered>
            <SepaAuthorizationText />
        </>
    );
};

export const sepaPaymentMethodUi: PaymentMethodUi<PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT> = {
    newMethodView: () => ({
        icon: IcBank,
        text: c('Payment method option').t`Bank transfer`,
    }),
    savedMethodIcon: () => IcBank,
    savedMethodLabel: getBankTransferLabel,
    renderSavedMethodTableCell: renderBankAccountTableCell,
    renderSavedMethodDetails: (details) => <SavedSepaDetailsView details={details} />,
};
