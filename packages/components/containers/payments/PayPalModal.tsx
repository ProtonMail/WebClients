import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { ensureTokenChargeable, usePaymentFacade } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { createTokenV4, setPaymentMethodV4 } from '@proton/shared/lib/api/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import type { ModalProps } from '../../components';
import { useApi, useEventManager, useNotifications, useUser } from '../../hooks';
import type { PaymentTokenResult } from '../../payments/core/interface';

const PAYMENT_AUTHORIZATION_AMOUNT = 100;
const PAYMENT_AUTHORIZATION_CURRENCY = 'CHF';

const PayPalV4Modal = ({ onClose, ...rest }: ModalProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loadingToken, withLoadingToken] = useLoading();
    const [loading, withLoading] = useLoading();
    const abortRef = useRef<AbortController>();
    const paypalRef = useRef<PaymentTokenResult | undefined>();
    const paymentMethodType = PAYMENT_METHOD_TYPES.PAYPAL;

    useEffect(() => {
        const run = async () => {
            const result = await api<PaymentTokenResult>(
                createTokenV4({
                    Amount: PAYMENT_AUTHORIZATION_AMOUNT,
                    Currency: PAYMENT_AUTHORIZATION_CURRENCY,
                    Payment: {
                        Type: paymentMethodType,
                    },
                })
            );
            paypalRef.current = result;
        };
        void withLoadingToken(run());
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleSubmit = async (data: PaymentTokenResult) => {
        try {
            abortRef.current = new AbortController();
            await ensureTokenChargeable({
                Token: data.Token,
                api,
                ApprovalURL: data.ApprovalURL,
                ReturnHost: data.ReturnHost,
                signal: abortRef.current.signal,
            });
            await api(
                setPaymentMethodV4({
                    Type: PAYMENT_METHOD_TYPES.TOKEN,
                    Details: {
                        Token: data.Token,
                    },
                })
            );
            await call();
            onClose?.();
            createNotification({ text: c('Success').t`Payment method added` });
        } catch (error: any) {
            // if not coming from API error
            if (error && error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
        }
    };

    return (
        <Prompt
            data-testid="addPPalModalTitle"
            title={c('Title').t`Add PayPal payment method`}
            onClose={onClose}
            buttons={[
                <Button
                    color="norm"
                    loading={loading}
                    disabled={loadingToken}
                    onClick={() => {
                        if (!paypalRef.current) {
                            return;
                        }
                        void withLoading(handleSubmit(paypalRef.current));
                    }}
                >{c('Action').t`Add PayPal`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {loading ? (
                <>
                    <div className="mb-4">{c('Info').t`Please verify payment at the new tab which was opened.`}</div>
                    <div>{c('Info').t`Verification can take a few minutes.`}</div>
                </>
            ) : (
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
            )}
        </Prompt>
    );
};

export default PayPalV4Modal;

type PaypalV5Props = ModalProps & {
    onMethodAdded: () => void;
};

export const PayPalV5Modal = ({ onClose, onMethodAdded, ...rest }: PaypalV5Props) => {
    const { createNotification } = useNotifications();
    const [user] = useUser();

    const paymentFacade = usePaymentFacade({
        amount: PAYMENT_AUTHORIZATION_AMOUNT,
        currency: PAYMENT_AUTHORIZATION_CURRENCY,
        flow: 'add-paypal',
        onChargeable: async ({ savePaymentMethod }) => {
            try {
                await savePaymentMethod();

                onClose?.();
                onMethodAdded();
                createNotification({ text: c('Success').t`Payment method added` });
            } catch (error: any) {
                if (error && error.message && !error.config) {
                    createNotification({ text: error.message, type: 'error' });
                }
            }
        },
        user,
    });

    return (
        <Prompt
            data-testid="addPPalModalTitle"
            title={c('Title').t`Add PayPal payment method`}
            onClose={onClose}
            buttons={[
                <ChargebeePaypalWrapper
                    chargebeePaypal={paymentFacade.chargebeePaypal}
                    iframeHandles={paymentFacade.iframeHandles}
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
