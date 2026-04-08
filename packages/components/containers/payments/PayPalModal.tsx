import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Prompt from '@proton/components/components/prompt/Prompt';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import useLoading from '@proton/hooks/useLoading';
import { ChargebeePaypalButton } from '@proton/payments/ui';
import { usePaymentPollers } from '@proton/payments/ui/hooks/usePaymentPollers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

const PAYMENT_AUTHORIZATION_AMOUNT = 100;
const PAYMENT_AUTHORIZATION_CURRENCY = 'CHF';

type PayPalModalProps = ModalProps & {
    app: APP_NAMES;
};

export const PayPalModal = ({ onClose, app, ...rest }: PayPalModalProps) => {
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const { createPaymentMethodsPoller } = usePaymentPollers();
    const [savingPaypal, withSavingPaypal] = useLoading();

    const paymentFacade = usePaymentFacade({
        amount: PAYMENT_AUTHORIZATION_AMOUNT,
        currency: PAYMENT_AUTHORIZATION_CURRENCY,
        flow: 'add-paypal',
        onChargeable: ({ savePaymentMethod }) => {
            withSavingPaypal(async () => {
                try {
                    const pollPaymentMethods = createPaymentMethodsPoller();
                    await savePaymentMethod();
                    // Poll until the new payment method has been added.
                    await pollPaymentMethods().catch(noop);
                    createNotification({ text: c('Success').t`Payment method added` });
                    onClose?.();
                } catch (error: any) {
                    if (error && error.message && !error.config) {
                        createNotification({ text: error.message, type: 'error' });
                    }
                }
            }).catch(noop);
        },
        user,
        product: app,
        telemetryContext: 'other',
    });

    return (
        <Prompt
            data-testid="addPPalModalTitle"
            title={c('Title').t`Add PayPal payment method`}
            onClose={onClose}
            buttons={[
                <ChargebeePaypalButton
                    width="100%"
                    chargebeePaypal={paymentFacade.chargebeePaypal}
                    iframeHandles={paymentFacade.iframeHandles}
                    loading={savingPaypal}
                />,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            <>
                <div className="mb-4">
                    {c('Info')
                        .t`This will enable PayPal to be used to pay for your ${BRAND_NAME} subscription. We will redirect you to PayPal in a new browser tab. If you use any pop-up blockers, please disable them to continue.`}
                </div>
                <div>
                    {c('Info')
                        .t`You must have a credit card or bank account linked with your PayPal account in order to add it as a payment method.`}
                </div>
            </>
        </Prompt>
    );
};
