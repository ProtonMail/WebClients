import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { APPS, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Loader } from '../../components';
import { useConfig, useModals, useMozillaCheck, usePaymentMethods } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import EditCardModal from '../payments/EditCardModal';
import PayPalModal from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const PaymentMethodsSection = () => {
    const { APP_NAME } = useConfig();
    const [paymentMethods = [], loadingPaymentMethods] = usePaymentMethods();
    const [isManagedByMozilla, loadingCheck] = useMozillaCheck();
    const { createModal } = useModals();

    if (loadingPaymentMethods || loadingCheck) {
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

    const learnMoreUrl =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/payment-options/'
            : getKnowledgeBaseUrl('/payment-options');

    const hasPayPal = paymentMethods.some((method) => method.Type === PAYMENT_METHOD_TYPES.PAYPAL);

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

                {!hasPayPal && (
                    <Button shape="outline" onClick={handlePayPal}>
                        {c('Action').t`Add PayPal`}
                    </Button>
                )}
            </div>
            <PaymentMethodsTable loading={false} methods={paymentMethods} />
        </SettingsSection>
    );
};

export default PaymentMethodsSection;
