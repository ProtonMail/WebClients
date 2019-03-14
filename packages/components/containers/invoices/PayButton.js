import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { SmallButton, useApiWithoutResult, useModal, useNotifications } from 'react-components';
import { getPaymentMethodStatus } from 'proton-shared/lib/api/payments';

import PayInvoiceModal from './PayInvoiceModal';

const PayButton = ({ invoice, fetchInvoices }) => {
    const { createNotification } = useNotifications();
    const { isOpen, open, close } = useModal();
    const { request, loading } = useApiWithoutResult(getPaymentMethodStatus);

    const handleClick = async () => {
        const { Stripe, Paymentwall } = await request();
        const canPay = Stripe || Paymentwall;

        if (!canPay) {
            createNotification({
                type: 'error',
                text: c('Error').t`Payments are currently not available, please try again later`
            });
        }

        open();
    };

    return (
        <>
            <SmallButton disabled={loading} onClick={handleClick}>{c('Action').t`Pay`}</SmallButton>
            <PayInvoiceModal invoice={invoice} show={isOpen} onClose={close} fetchInvoices={fetchInvoices} />
        </>
    );
};

PayButton.propTypes = {
    invoice: PropTypes.object.isRequired,
    fetchInvoices: PropTypes.func.isRequired
};

export default PayButton;
