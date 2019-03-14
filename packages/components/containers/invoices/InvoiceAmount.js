import React from 'react';
import { Price } from 'react-components';
import PropTypes from 'prop-types';
import { INVOICE_STATE } from 'proton-shared/lib/constants';

const InvoiceAmount = ({ invoice }) => {
    const format = ({ State, AmountCharged = 0, AmountDue = 0 }) => {
        const value = State === INVOICE_STATE.UNPAID ? AmountDue : AmountCharged;
        return value;
    };

    return <Price currency={invoice.Currency}>{format(invoice)}</Price>;
};

InvoiceAmount.propTypes = {
    invoice: PropTypes.object.isRequired
};

export default InvoiceAmount;
