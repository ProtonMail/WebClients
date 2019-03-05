import React from 'react';
import { c } from 'ttag';
import { SubTitle, PrimaryButton, Alert, Block, LearnMore, useApi, useModal } from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';

import EditCardModal from '../payments/EditCardModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const PaymentMethodsSection = () => {
    const { isOpen: showCardModal, open: openCardModal, close: closeCardModal } = useModal();
    const { result = {}, loading } = useApi(queryPaymentMethods, []);

    const { PaymentMethods: paymentMethods = [] } = result;

    return (
        <>
            <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
            <Alert>
                {c('Info for payment methods').t`Lorem ipsum`}
                <br />
                <LearnMore url="todo" />
            </Alert>
            <Block>
                <PrimaryButton onClick={openCardModal}>{c('Action').t`Add payment method`}</PrimaryButton>
                <EditCardModal show={showCardModal} onClose={closeCardModal} />
            </Block>
            <PaymentMethodsTable loading={loading} methods={paymentMethods} />
        </>
    );
};

export default PaymentMethodsSection;
