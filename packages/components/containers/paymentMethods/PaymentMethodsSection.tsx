import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useChargebeeEnabledCache } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { MethodStorage, PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { Icon, Loader, useModalState } from '../../components';
import { useConfig, useMozillaCheck, usePaymentMethods } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import EditCardModal from '../payments/EditCardModal';
import { default as PayPalV4Modal, PayPalV5Modal } from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const AddPaypalButton = ({ onClick }: { onClick: () => void }) => {
    return (
        <Button shape="outline" onClick={onClick}>
            <Icon name="brand-paypal" className="mr-2" />
            <span>{c('Action').t`Add PayPal`}</span>
        </Button>
    );
};

const PaymentMethodsSection = () => {
    const { APP_NAME } = useConfig();
    const [paymentMethods = [], loadingPaymentMethods] = usePaymentMethods();
    const [isManagedByMozilla, loadingCheck] = useMozillaCheck();
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const [paypalV4ModalProps, setPaypalV4ModalOpen, renderPaypalV4Modal] = useModalState();
    const [paypalV5ModalProps, setPaypalV5ModalOpen, renderPaypalV5Modal] = useModalState();
    const chargebeeEnabled = useChargebeeEnabledCache();

    if (loadingPaymentMethods || loadingCheck) {
        return <Loader />;
    }

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const learnMoreUrl =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/payment-options/'
            : getKnowledgeBaseUrl('/payment-options');

    const canAddV4 = chargebeeEnabled !== ChargebeeEnabled.CHARGEBEE_FORCED;

    const canAddPaypalV4 =
        !paymentMethods.some(
            (method) => method.Type === PAYMENT_METHOD_TYPES.PAYPAL && method.External === MethodStorage.INTERNAL
        ) && canAddV4;

    const canAddPaypalV5 =
        !paymentMethods.some(
            (method) => method.Type === PAYMENT_METHOD_TYPES.PAYPAL && method.External === MethodStorage.EXTERNAL
        ) && !canAddV4;

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl={learnMoreUrl}>
                {c('Info for payment methods')
                    .t`You can add a payment method to have your subscription renewed automatically. Other payment methods are also available.`}
            </SettingsParagraph>
            <div className="mb-4">
                <Button shape="outline" className="mr-4" onClick={() => setCreditCardModalOpen(true)}>
                    <Icon name="credit-card" className="mr-2" />
                    <span>{c('Action').t`Add credit / debit card`}</span>
                </Button>
                {canAddPaypalV4 && <AddPaypalButton onClick={() => setPaypalV4ModalOpen(true)} />}
                {canAddPaypalV5 && <AddPaypalButton onClick={() => setPaypalV5ModalOpen(true)} />}
            </div>
            <PaymentMethodsTable loading={false} methods={paymentMethods} />
            {renderCreditCardModal && <EditCardModal {...creditCardModalProps} />}
            {renderPaypalV4Modal && <PayPalV4Modal {...paypalV4ModalProps} />}
            {renderPaypalV5Modal && <PayPalV5Modal {...paypalV5ModalProps} />}
        </SettingsSection>
    );
};

export default PaymentMethodsSection;
