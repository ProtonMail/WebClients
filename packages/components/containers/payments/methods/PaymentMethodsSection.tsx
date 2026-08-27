import { c } from 'ttag';

import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { IcBrandPaypal } from '@proton/icons/icons/IcBrandPaypal';
import { IcCreditCard } from '@proton/icons/icons/IcCreditCard';
import EditCardModal from '@proton/payments-ui/ui/containers/EditCardModal';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { getAvailableSubscriptionActions } from '@proton/payments/core/subscription/helpers';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Loader from '../../../components/loader/Loader';
import useModalState from '../../../components/modalTwo/useModalState';
import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSection from '../../account/SettingsSection';
import { useRedirectToAccountApp } from '../../desktop/useRedirectToAccountApp';
import { PayPalModal } from '../PayPalModal';
import InAppPurchaseModal from '../subscription/InAppPurchaseModal';
import PaymentMethodsTable from './PaymentMethodsTable';

const AddPaypalButton = ({ onClick, ...rest }: ButtonProps) => {
    return (
        <Button shape="outline" onClick={onClick} {...rest}>
            <IcBrandPaypal className="mr-2" />
            <span>{c('Action').t`Add PayPal`}</span>
        </Button>
    );
};

const PaymentMethodsSection = ({ app }: { app: APP_NAMES }) => {
    const { APP_NAME } = useConfig();
    const [paymentMethods = [], loadingPaymentMethods] = usePaymentMethods();
    const [creditCardModalProps, setCreditCardModalOpen, renderCreditCardModal] = useModalState();
    const [paypalV5ModalProps, setPaypalV5ModalOpen, renderPaypalV5Modal] = useModalState();
    const [inAppPurchaseModalProps, setInAppPurchaseModalOpen, renderInAppPurchaseModal] = useModalState();
    const [subscription, loadingSubscription] = useSubscription();
    const redirectToAccountApp = useRedirectToAccountApp();

    if (loadingPaymentMethods || loadingSubscription || !subscription) {
        return <Loader />;
    }

    const learnMoreUrl =
        APP_NAME === APPS.PROTONVPN_SETTINGS
            ? 'https://protonvpn.com/support/payment-options/'
            : getKnowledgeBaseUrl('/payment-options');

    const subscriptionActions = getAvailableSubscriptionActions(subscription);

    const hasSavedPaypal = paymentMethods.some((method) => method.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);

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
                    <IcCreditCard className="mr-2" />
                    <span>{c('Action').t`Add credit / debit card`}</span>
                </Button>
                {!hasSavedPaypal && (
                    <AddPaypalButton
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
            <PaymentMethodsTable methods={paymentMethods} app={app} />
            {renderCreditCardModal && <EditCardModal editExistingCard={false} app={app} {...creditCardModalProps} />}
            {renderPaypalV5Modal && <PayPalModal app={app} {...paypalV5ModalProps} />}
            {renderInAppPurchaseModal && subscription && (
                <InAppPurchaseModal {...inAppPurchaseModalProps} subscription={subscription} />
            )}
        </SettingsSection>
    );
};

export default PaymentMethodsSection;
