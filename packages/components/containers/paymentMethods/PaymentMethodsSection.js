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
    useSubscription,
    useConfig
} from 'react-components';
import { queryPaymentMethods } from 'proton-shared/lib/api/payments';
import { APPS } from 'proton-shared/lib/constants';

import EditCardModal from '../payments/EditCardModal';
// import PayPalModal from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const { PROTONVPN_SETTINGS } = APPS;

const PaymentMethodsSection = () => {
    const { APP_NAME } = useConfig();
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

    const handleCard = () => {
        createModal(<EditCardModal onChange={request} />);
    };

    // const handlePayPal = () => {
    //     createModal(<PayPalModal onChange={request} />);
    // };

    return (
        <>
            <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
            <Alert
                learnMore={
                    APP_NAME === PROTONVPN_SETTINGS
                        ? 'https://protonvpn.com/support/payment-options/'
                        : 'https://protonmail.com/support/knowledge-base/payment'
                }
            >{c('Info for payment methods')
                .t`If you wish to pay by credit card, you can add your card below. Learn about other payment options.`}</Alert>
            <Block>
                <PrimaryButton className="mr1" onClick={handleCard}>{c('Action')
                    .t`Add credit / debit card`}</PrimaryButton>
                {/* <PrimaryButton onClick={handlePayPal}>{c('Action').t`Add PayPal`}</PrimaryButton> */}
            </Block>
            <PaymentMethodsTable loading={loading} methods={paymentMethods} fetchMethods={request} />
        </>
    );
};

export default PaymentMethodsSection;
