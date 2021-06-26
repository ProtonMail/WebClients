import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { orderBy } from '@proton/shared/lib/helpers/array';

import { Table, TableHeader, TableBody, TableRow } from '../../components';
import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

const PaymentMethodsTable = ({ methods, loading }) => {
    if (!loading && !methods.length) {
        return <p>{c('Info').t`You have no saved payment methods.`}</p>;
    }

    const getMethod = (method) => {
        switch (method.Type) {
            case PAYMENT_METHOD_TYPES.CARD:
                return `${method.Details.Brand} (•••• ${method.Details.Last4})`;
            case PAYMENT_METHOD_TYPES.PAYPAL:
                return (
                    <>
                        <span className="mr0-5">PayPal</span>
                        <span className="auto-tablet text-ellipsis max-w100" title={method.Details.Payer}>
                            {method.Details.Payer}
                        </span>
                    </>
                );
            default:
                return '';
        }
    };

    const orderedMethods = orderBy(methods, 'Order');

    return (
        <Table className="simple-table--has-actions">
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
                                getMethod(method),
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

PaymentMethodsTable.propTypes = {
    methods: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
};

export default PaymentMethodsTable;
