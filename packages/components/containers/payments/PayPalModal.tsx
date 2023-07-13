import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ensureTokenChargeable } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import { createToken, setPaymentMethod } from '@proton/shared/lib/api/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { ModalProps, Prompt } from '../../components';
import { useApi, useEventManager, useNotifications } from '../../hooks';
import { PaymentTokenResult } from '../../payments/core/interface';

const PAYMENT_AUTHORIZATION_AMOUNT = 100;
const PAYMENT_AUTHORIZATION_CURRENCY = 'CHF';

const PayPalModal = ({ onClose, ...rest }: ModalProps) => {
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
                createToken({
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
        abortRef.current = new AbortController();
        await ensureTokenChargeable({
            Token: data.Token,
            api,
            ApprovalURL: data.ApprovalURL,
            ReturnHost: data.ReturnHost,
            signal: abortRef.current.signal,
        });
        await api(
            setPaymentMethod({
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: data.Token,
                },
            })
        );
        await call();
        onClose?.();
        createNotification({ text: c('Success').t`Payment method added` });
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

export default PayPalModal;
