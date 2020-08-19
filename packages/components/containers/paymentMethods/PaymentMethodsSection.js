import React from 'react';
import { c } from 'ttag';
import { APPS, PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { useModals, useSubscription, useConfig, usePaymentMethods } from '../../hooks';
import { PrimaryButton, Alert, Block, Loader } from '../../components';

import MozillaInfoPanel from '../account/MozillaInfoPanel';
import EditCardModal from '../payments/EditCardModal';
import PayPalModal from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const PaymentMethodsSection = () => {
    const { APP_NAME } = useConfig();
    const [paymentMethods = [], loadingPaymentMethods] = usePaymentMethods();
    const [{ isManagedByMozilla } = {}, loadingSubscription] = useSubscription();
    const { createModal } = useModals();

    if (loadingPaymentMethods || loadingSubscription) {
        return <Loader />;
    }

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
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
            <Alert
                learnMore={
                    APP_NAME === APPS.PROTONVPN_SETTINGS
                        ? 'https://protonvpn.com/support/payment-options/'
                        : 'https://protonmail.com/support/knowledge-base/payment'
                }
            >{c('Info for payment methods')
                .t`If you wish to have your subscription renewed automatically, you can add your credit card or PayPal account to the list of saved payment methods. Other payment methods are also available.`}</Alert>
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
