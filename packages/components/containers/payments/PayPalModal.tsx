import { useEffect, useRef } from 'react';
import { c } from 'ttag';
import { createToken, setPaymentMethod } from '@proton/shared/lib/api/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';

import { useApi, useEventManager, useLoading, useNotifications } from '../../hooks';
import { Alert, Button, FormModal, Loader, PrimaryButton } from '../../components';
import { process } from './paymentTokenHelper';
import { PaymentTokenResult } from './interface';

const PAYMENT_AUTHORIZATION_AMOUNT = 100;
const PAYMENT_AUTHORIZATION_CURRENCY = 'CHF';

const PayPalModal = (props: any) => {
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
        withLoadingToken(run());
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const handleSubmit = async (data: PaymentTokenResult) => {
        abortRef.current = new AbortController();
        await process({
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
        props.onClose();
        createNotification({ text: c('Success').t`Payment method added` });
    };

    return (
        <FormModal title={c('Title').t`Add PayPal payment method`} small footer={null} {...props}>
            {loading ? (
                <>
                    <p className="text-center">{c('Info').t`Please verify payment at the new tab which was opened.`}</p>
                    <Loader />
                    <p className="text-center">
                        <Button
                            onClick={() => {
                                abortRef.current?.abort();
                            }}
                        >{c('Action').t`Cancel`}</Button>
                    </p>
                    <Alert>{c('Info').t`Verification can take a few minutes.`}</Alert>
                </>
            ) : (
                <>
                    <Alert>
                        {c('Info')
                            .t`This will enable PayPal to be used to pay for your Proton subscription. We will redirect you to PayPal in a new browser tab. If you use any pop-up blockers, please disable them to continue.`}
                    </Alert>
                    <div className="mb1">
                        <PrimaryButton
                            loading={loading || loadingToken}
                            onClick={() => {
                                if (!paypalRef.current) {
                                    return;
                                }
                                withLoading(handleSubmit(paypalRef.current));
                            }}
                        >{c('Action').t`Add PayPal payment method`}</PrimaryButton>
                    </div>
                    <Alert>{c('Info')
                        .t`You must have a credit card or bank account linked with your PayPal account in order to add it as a payment method.`}</Alert>
                </>
            )}
        </FormModal>
    );
};

export default PayPalModal;
