import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    PrimaryButton,
    Alert,
    Block,
    MozillaInfoPanel,
    useModals,
    useSubscription,
    useConfig,
    useMethods
} from 'react-components';
import { CLIENT_TYPES, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

import EditCardModal from '../payments/EditCardModal';
import PayPalModal from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const { VPN } = CLIENT_TYPES;

const PaymentMethodsSection = () => {
    const { CLIENT_TYPE } = useConfig();
    const [paymentMethods, loadingPaymentMethods] = useMethods();
    const [{ isManagedByMozilla } = {}, loadingSubscription] = useSubscription();
    const { createModal } = useModals();

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    const handleCard = () => {
        createModal(<EditCardModal />);
    };

    const handlePayPal = () => {
        createModal(<PayPalModal />);
    };

    const hasPayPal = paymentMethods.some((method) => method.Type === PAYMENT_METHOD_TYPES.PAYPAL);

    return (
        <>
            <SubTitle>{c('Title').t`Payment methods`}</SubTitle>
            <Alert
                learnMore={
                    CLIENT_TYPE === VPN
                        ? 'https://protonvpn.com/support/payment-options/'
                        : 'https://protonmail.com/support/knowledge-base/payment'
                }
            >{c('Info for payment methods')
                .t`If you wish to pay by credit card, you can add your card below. Learn about other payment options.`}</Alert>
            <Block>
                <PrimaryButton className="mr1" onClick={handleCard}>{c('Action')
                    .t`Add credit / debit card`}</PrimaryButton>
                {hasPayPal ? null : <PrimaryButton onClick={handlePayPal}>{c('Action').t`Add PayPal`}</PrimaryButton>}
            </Block>
            <PaymentMethodsTable loading={loadingPaymentMethods || loadingSubscription} methods={paymentMethods} />
        </>
    );
};

export default PaymentMethodsSection;
