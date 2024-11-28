import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import { formattedSavedSepaDetails } from '@proton/components/payments/client-extensions/useMethods';
import type { SavedPaymentMethod } from '@proton/payments';
import { isPaypalDetails, isSavedPaymentMethodSepa } from '@proton/payments';
import orderBy from '@proton/utils/orderBy';

import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

const NBSP_HTML = '\u00A0';

export interface Props {
    methods: SavedPaymentMethod[];
    loading: boolean;
}

const MethodCell = ({ method }: { method: SavedPaymentMethod }) => {
    if (isPaypalDetails(method.Details)) {
        return (
            <>
                <span className="mr-2 align-middle" data-testid="payment-method">
                    PayPal
                </span>
                <span
                    className="block lg:inline-block align-middle text-ellipsis max-w-full"
                    data-testid="payer"
                    title={method.Details.Payer}
                >
                    {method.Details.Payer}
                </span>
            </>
        );
    }

    const hiddenDigitsPlaceholder = '••••';

    if (isSavedPaymentMethodSepa(method)) {
        return (
            <>
                <span className="mr-2 align-middle" data-testid="sepa-payment-method">
                    SEPA Direct Debit
                </span>
                <span
                    className="block lg:inline-block align-middle text-ellipsis max-w-full"
                    data-testid="sepa-details"
                >
                    {formattedSavedSepaDetails(method.Details)}
                </span>
            </>
        );
    }

    if (method.Details && method.Details.Brand && method.Details.Last4) {
        const cardDetails = `${method.Details.Brand} (${hiddenDigitsPlaceholder}${NBSP_HTML}${method.Details.Last4})`;
        return <span data-testid="card-details">{cardDetails}</span>;
    }

    return null;
};

const PaymentMethodsTable = ({ methods, loading }: Props) => {
    if (!loading && !methods.length) {
        return <p data-testid="no-payments">{c('Info').t`You have no saved payment methods.`}</p>;
    }

    const orderedMethods = orderBy(methods, 'Order');

    return (
        <Table hasActions responsive="cards">
            <TableHeader
                cells={[
                    c('Title for payment methods table').t`Method`,
                    c('Title for payment methods table').t`Status`,
                    c('Title for payment methods table').t`Actions`,
                ]}
            />
            <TableBody loading={loading} colSpan={3}>
                {orderedMethods.map((method, index) => {
                    return (
                        <TableRow
                            key={method.ID}
                            cells={[
                                <MethodCell method={method} />,
                                <PaymentMethodState key={method.ID} method={method} index={index} />,
                                <PaymentMethodActions
                                    key={method.ID}
                                    index={index}
                                    methods={orderedMethods}
                                    method={method}
                                />,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default PaymentMethodsTable;
