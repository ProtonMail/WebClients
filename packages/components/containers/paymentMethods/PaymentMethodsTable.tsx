import { c } from 'ttag';

import { isPaypalDetails, isSavedCardDetails } from '@proton/components/payments/core';
import { SavedPaymentMethod } from '@proton/components/payments/core';
import orderBy from '@proton/utils/orderBy';

import { Table, TableBody, TableHeader, TableRow } from '../../components';
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
                <span className="mr-2" data-testid="payment-method">
                    PayPal
                </span>
                <span className="auto-tablet text-ellipsis max-w100" data-testid="payer" title={method.Details.Payer}>
                    {method.Details.Payer}
                </span>
            </>
        );
    }

    if (isSavedCardDetails(method.Details)) {
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
            <TableBody loading={loading} colSpan={5}>
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
