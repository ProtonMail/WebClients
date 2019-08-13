import React from 'react';
import { c } from 'ttag';
import { Table, TableHeader, TableBody, TableRow, Alert } from 'react-components';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

const PaymentMethodsTable = ({ methods, loading, fetchMethods }) => {
    if (!loading && !methods.length) {
        return <Alert>{c('Info').t`You have no saved payment methods.`}</Alert>;
    }

    const getMethod = (method) => {
        switch (method.Type) {
            case PAYMENT_METHOD_TYPES.CARD:
                return `${method.Details.Brand} (•••• ${method.Details.Last4})`;
            case PAYMENT_METHOD_TYPES.PAYPAL:
                return `PayPal ${method.Details.Payer}`;
            default:
                return '';
        }
    };

    return (
        <Table>
            <TableHeader
                cells={[
                    c('Title for payment methods table').t`Method`,
                    c('Title for payment methods table').t`Status`,
                    c('Title for payment methods table').t`Actions`
                ]}
            />
            <TableBody loading={loading} colSpan={5}>
                {methods.map((method, index) => {
                    return (
                        <TableRow
                            key={method.ID}
                            cells={[
                                getMethod(method),
                                <PaymentMethodState key={method.ID} method={method} index={index} />,
                                <PaymentMethodActions
                                    key={method.ID}
                                    index={index}
                                    methods={methods}
                                    method={method}
                                    onChange={fetchMethods}
                                />
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
    fetchMethods: PropTypes.func.isRequired
};

export default PaymentMethodsTable;
