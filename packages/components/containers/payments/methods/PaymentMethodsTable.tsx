import { c } from 'ttag';

import type { SavedPaymentMethod } from '@proton/payments';
import { isPaypalDetails } from '@proton/payments';
import orderBy from '@proton/utils/orderBy';

import { Table, TableBody, TableHeader, TableRow } from '../../../components';
import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

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

    if (method.Details && method.Details.Brand && method.Details.Last4) {
        return (
            <span data-testid="card-details">
                {method.Details.Brand} (•••• {method.Details.Last4})
            </span>
        );
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
