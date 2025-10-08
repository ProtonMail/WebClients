import { c } from 'ttag';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useConfig from '@proton/components/hooks/useConfig';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import useLoading from '@proton/hooks/useLoading';
import {
    MethodStorage,
    PAYMENT_METHOD_TYPES,
    type SavedPaymentMethod,
    getAvailableSubscriptionActions,
} from '@proton/payments';
import { EditCardModal } from '@proton/payments/ui';
import { APPS, EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useRedirectToAccountApp } from '../../desktop/useRedirectToAccountApp';
import { PayPalV5Modal } from '../PayPalModal';
import InAppPurchaseModal from '../subscription/InAppPurchaseModal';
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
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const [paypalV5ModalProps, setPaypalV5ModalOpen, renderPaypalV5Modal] = useModalState();
    const [inAppPurchaseModalProps, setInAppPurchaseModalOpen, renderInAppPurchaseModal] = useModalState();
    const [subscription, loadingSubscription] = useSubscription();
    const pollPaymentMethodsCreate = usePollEvents({
        subscribeToProperty: 'PaymentMethods',
        action: EVENT_ACTIONS.CREATE,
    });
    const [pollingEvents, withPollingEvents] = useLoading();
    const redirectToAccountApp = useRedirectToAccountApp();

    if (loadingPaymentMethods || loadingSubscription || !subscription) {
        return <Loader />;
    }

    const learnMoreUrl =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/payment-options/'
            : getKnowledgeBaseUrl('/payment-options');

    const paypalPredicate = (method: SavedPaymentMethod) =>
        method.Type === PAYMENT_METHOD_TYPES.PAYPAL &&
        (method.External === MethodStorage.INTERNAL || method.External === MethodStorage.EXTERNAL);

    const canAddPaypalV5 = !paymentMethods.some(paypalPredicate);

    const loadAddedMethod = () => {
        void withPollingEvents(pollPaymentMethodsCreate());
    };

    const subscriptionActions = getAvailableSubscriptionActions(subscription);

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

                        if (!subscriptionActions.canModify) {
                            setInAppPurchaseModalOpen(true);
                            return;
                        }

                        setCreditCardModalOpen(true);
                    }}
                >
                    <Icon name="credit-card" className="mr-2" />
                    <span>{c('Action').t`Add credit / debit card`}</span>
                </Button>
                {canAddPaypalV5 && (
                    <AddPaypalButton
                        disabled={pollingEvents}
                        onClick={() => {
                            if (redirectToAccountApp()) {
                                return;
                            }

                            if (!subscriptionActions.canModify) {
                                setInAppPurchaseModalOpen(true);
                                return;
                            }

                            setPaypalV5ModalOpen(true);
                        }}
                    />
                )}
            </div>
            <PaymentMethodsTable loading={pollingEvents} methods={paymentMethods} />
            {renderCreditCardModal && <EditCardModal onMethodAdded={loadAddedMethod} {...creditCardModalProps} />}
            {renderPaypalV5Modal && <PayPalV5Modal onMethodAdded={loadAddedMethod} {...paypalV5ModalProps} />}
            {renderInAppPurchaseModal && subscription && (
                <InAppPurchaseModal {...inAppPurchaseModalProps} subscription={subscription} />
            )}
        </SettingsSection>
    );
};

export default PaymentMethodsSection;
