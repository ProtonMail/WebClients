import React from 'react';
import { c } from 'ttag';
import { Table, TableHeader, TableBody, Alert } from 'react-components';
import PropTypes from 'prop-types';

import PaymentMethodActions from './PaymentMethodActions';
import PaymentMethodState from './PaymentMethodState';

const TYPES = {
    card: c('Label in payment methods table').t`Credit card`
};

const PaymentMethodsTable = ({ methods, loading }) => {
    if (!loading && !methods.length) {
        return <Alert>{c('Info').t`You have no saved payment methods.`}</Alert>
    }

    return (
        <Table>
            <TableHeader cells={[
                c('Title for payment methods table').t`Method`,
                c('Title for payment methods table').t`NR`,
                c('Title for payment methods table').t`Name`,
                c('Title for payment methods table').t`Status`,
                c('Title for payment methods table').t`Actions`
            ]} />
            <TableBody loading={loading}>
                {methods.map((method, index) => {
                    return <TableRow key={method.ID} cells={[
                        `${TYPES[method.Type]} (${method.Details.Brand})`,
                        `•••• •••• •••• ${method.Details.Last4}`,
                        method.Details.Name,
                        <PaymentMethodState key={method.ID} method={method} index={index} />,
                        <PaymentMethodActions key={method.ID} method={method} onChange={fetchMethods} />
                    ]} />;
                })}
            </TableBody>
        </Table>
    );
};

PaymentMethodsTable.propTypes = {
    methods: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired
};

export default PaymentMethodsTable;