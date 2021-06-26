import React from 'react';
import { c } from 'ttag';
import { APPS, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { useModals, useSubscription, useConfig, usePaymentMethods } from '../../hooks';
import { Button, Loader } from '../../components';

import MozillaInfoPanel from '../account/MozillaInfoPanel';
import EditCardModal from '../payments/EditCardModal';
import PayPalModal from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';
import { SettingsParagraph, SettingsSection } from '../account';

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

    const learnMoreUrl =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/payment-options/'
            : 'https://protonmail.com/support/knowledge-base/payment';

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl={learnMoreUrl}>
                {c('Info for payment methods')
                    .t`You can add a payment method to have your subscription renewed automatically. Other payment methods are also available.`}
            </SettingsParagraph>
            <div className="mb1">
                <Button shape="outline" className="mr1" onClick={handleCard}>
                    {c('Action').t`Add credit / debit card`}
                </Button>

                {hasPayPal ? null : (
                    <Button shape="outline" onClick={handlePayPal}>
                        {c('Action').t`Add PayPal`}
                    </Button>
                )}
            </div>
            <PaymentMethodsTable loading={loadingPaymentMethods || loadingSubscription} methods={paymentMethods} />
        </SettingsSection>
    );
};

export default PaymentMethodsSection;
