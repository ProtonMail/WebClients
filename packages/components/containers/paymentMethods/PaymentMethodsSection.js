import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    PrimaryButton,
    Alert,
    Block,
    MozillaInfoPanel,
    useApiResult,
    useModals,
    useSubscription
} from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';

import EditCardModal from '../payments/EditCardModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const PaymentMethodsSection = () => {
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const { createModal } = useModals();
    const { result = {}, loading, request } = useApiResult(queryPaymentMethods, []);
    const { PaymentMethods: paymentMethods = [] } = result;

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    const handleOpenModal = () => {
        createModal(<EditCardModal onChange={request} />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
            <Alert learnMore="todo">{c('Info for payment methods').t`Lorem ipsum`}</Alert>
            <Block>
                <PrimaryButton onClick={handleOpenModal}>{c('Action').t`Add payment method`}</PrimaryButton>
            </Block>
            <PaymentMethodsTable loading={loading} methods={paymentMethods} fetchMethods={request} />
        </>
    );
};

export default PaymentMethodsSection;
