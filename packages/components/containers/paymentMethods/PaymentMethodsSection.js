import React, { useState, useEffect, useContext } from 'react';
import { c } from 'ttag';
import { SubTitle, PrimaryButton, Alert, Block, LearnMore, useLoading, useModal } from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';
import ContextApi from 'proton-shared/lib/context/api';

import EditCardModal from '../payments/EditCardModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const PaymentMethodsSection = () => {
    const { api } = useContext(ContextApi);
    const { isOpen: showCardModal, open: openCardModal, close: closeCardModal } = useModal();
    const { loading, loaded, load } = useLoading();
    const [methods, setMethods] = useState([]);

    const fetchMethods = async () => {
        try {
            load();
            const { PaymentMethods } = await api(queryPaymentMethods());
            setMethods(PaymentMethods);
            loaded();
        } catch (error) {
            loaded();
            throw error;
        }
    };

    useEffect(() => {
        fetchMethods();
    }, []);

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
            <PaymentMethodsTable loading={loading} methods={methods} />
        </>
    );
};

export default PaymentMethodsSection;
