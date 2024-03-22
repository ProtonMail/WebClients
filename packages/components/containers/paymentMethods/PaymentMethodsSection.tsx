import { c } from 'ttag';

import { Button, ButtonProps } from '@proton/atoms';
import { useChargebeeEnabledCache } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import { MethodStorage, PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import useLoading from '@proton/hooks/useLoading';
import { APPS, EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { Icon, Loader, useModalState } from '../../components';
import { useConfig, useMozillaCheck, usePaymentMethods } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { redirectToAccountApp } from '../desktop/openExternalLink';
import EditCardModal from '../payments/EditCardModal';
import { default as PayPalV4Modal, PayPalV5Modal } from '../payments/PayPalModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const AddPaypalButton = ({ onClick, ...rest }: ButtonProps) => {
    return (
        <Button shape="outline" onClick={onClick} {...rest}>
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
    const pollPaymentMethodsCreate = usePollEvents({
        subscribeToProperty: 'PaymentMethods',
        action: EVENT_ACTIONS.CREATE,
    });
    const [pollingEvents, withPollingEvents] = useLoading();

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

    const loadAddedMethod = () => {
        void withPollingEvents(pollPaymentMethodsCreate());
    };

    return (
        <SettingsSection>
            <SettingsParagraph learnMoreUrl={learnMoreUrl}>
                {c('Info for payment methods')
                    .t`You can add a payment method to have your subscription renewed automatically. Other payment methods are also available.`}
            </SettingsParagraph>
            <div className="mb-4">
                <Button
                    shape="outline"
                    className="mr-4"
                    disabled={pollingEvents}
                    onClick={() => {
                        if (redirectToAccountApp()) {
                            return;
                        }

                        setCreditCardModalOpen(true);
                    }}
                >
                    <Icon name="credit-card" className="mr-2" />
                    <span>{c('Action').t`Add credit / debit card`}</span>
                </Button>
                {canAddPaypalV4 && (
                    <AddPaypalButton
                        disabled={pollingEvents}
                        onClick={() => {
                            if (redirectToAccountApp()) {
                                return;
                            }

                            setPaypalV4ModalOpen(true);
                        }}
                    />
                )}
                {canAddPaypalV5 && (
                    <AddPaypalButton
                        disabled={pollingEvents}
                        onClick={() => {
                            if (redirectToAccountApp()) {
                                return;
                            }

                            setPaypalV5ModalOpen(true);
                        }}
                    />
                )}
            </div>
            <PaymentMethodsTable loading={pollingEvents} methods={paymentMethods} />
            {renderCreditCardModal && <EditCardModal onMethodAdded={loadAddedMethod} {...creditCardModalProps} />}
            {renderPaypalV4Modal && <PayPalV4Modal {...paypalV4ModalProps} />}
            {renderPaypalV5Modal && <PayPalV5Modal onMethodAdded={loadAddedMethod} {...paypalV5ModalProps} />}
        </SettingsSection>
    );
};

export default PaymentMethodsSection;
