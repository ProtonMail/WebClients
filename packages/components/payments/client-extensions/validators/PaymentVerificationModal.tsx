import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FormModal, Loader, PrimaryButton } from '@proton/components/components';
import PaymentVerificationImage from '@proton/components/containers/payments/PaymentVerificationImage';
import { useNotifications } from '@proton/components/hooks';
import { type CardPayment, PAYMENT_METHOD_TYPES } from '@proton/payments';
import errorSvg from '@proton/styles/assets/img/errors/error-generic.svg';

const STEPS = {
    REDIRECT: 'redirect',
    REDIRECTING: 'redirecting',
    REDIRECTED: 'redirected',
    FAIL: 'fail',
};

const DEFAULT_PROCESSING_DELAY = 5000;

export interface PromiseWithController {
    promise: Promise<void>;
    abort: AbortController;
}

export interface Props {
    onSubmit: () => void;
    onClose: () => void;
    payment?: CardPayment | {};
    isAddCard?: boolean;
    type?: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT | PAYMENT_METHOD_TYPES.CARD;
    onProcess: () => PromiseWithController;
    initialProcess?: PromiseWithController;
    processingDelay?: number;
}

const PaymentVerificationModal = ({
    onSubmit,
    payment = {},
    isAddCard,
    type = PAYMENT_METHOD_TYPES.CARD,
    onProcess,
    initialProcess,
    processingDelay = DEFAULT_PROCESSING_DELAY,
    ...rest
}: Props) => {
    const isPayPal = [PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.PAYPAL_CREDIT].includes(type);

    let failTitle;
    if (isPayPal) {
        failTitle = c('Title').t`PayPal verification failed`;
    } else if (isAddCard) {
        failTitle = c('Title').t`Verification failed`;
    } else {
        failTitle = c('Title').t`Payment failed`;
    }

    const TITLES = {
        [STEPS.REDIRECT]: isAddCard ? c('Title').t`Card verification` : c('Title').t`Payment verification`,
        [STEPS.REDIRECTING]: c('Title').t`Processing...`,
        [STEPS.REDIRECTED]: isAddCard ? c('Title').t`Verifying your card...` : c('Title').t`Verifying your payment...`,
        [STEPS.FAIL]: failTitle,
    };

    const [step, setStep] = useState(() => STEPS.REDIRECT);
    const [error, setError] = useState<{ tryAgain?: boolean }>({});
    const { createNotification } = useNotifications();
    const abortRef = useRef<AbortController>();
    const timeoutRef = useRef<number>();

    const handleCancel = () => {
        abortRef.current?.abort();
        rest.onClose();
    };

    const handleSubmit = async ({ abort, promise }: PromiseWithController) => {
        try {
            setStep(STEPS.REDIRECTING);
            timeoutRef.current = window.setTimeout(() => {
                setStep(STEPS.REDIRECTED);
            }, processingDelay);
            abortRef.current = abort;
            await promise;
            onSubmit();
            rest.onClose();
        } catch (error: any) {
            window.clearTimeout(timeoutRef.current);
            setStep(STEPS.FAIL);
            setError(error);
            // if not coming from API error
            if (error && error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
        }
    };

    useEffect(() => {
        if (initialProcess) {
            handleSubmit(initialProcess);
        }
    }, []);

    useEffect(() => {
        return () => window.clearTimeout(timeoutRef.current);
    }, []);

    return (
        <FormModal
            title={TITLES[step]}
            onSubmit={() => handleSubmit(onProcess())}
            small
            noTitleEllipsis
            hasClose={false}
            footer={
                step === STEPS.REDIRECT ? (
                    <>
                        <Button type="reset">{c('Action').t`Cancel`}</Button>
                        <PrimaryButton type="submit">{c('Action').t`Verify`}</PrimaryButton>
                    </>
                ) : null
            }
            {...rest}
        >
            {{
                [STEPS.REDIRECT]: () => (
                    <>
                        <p className="text-center">
                            {isAddCard
                                ? c('Info').t`We need to authenticate your payment method with your bank.`
                                : c('Info').t`We need to authenticate your payment with your bank.`}
                        </p>
                        <p className="text-center">
                            <PaymentVerificationImage payment={payment} type={type} />
                        </p>
                        <div className="mb-4" data-testid="redirect-message">
                            {isAddCard
                                ? c('Info')
                                      .t`Verification will open a new tab, please disable any popup blockers. You will not be charged. Any amount used to verify the card will be refunded immediately.`
                                : c('Info')
                                      .t`The verification process will open a new browser tab. Please disable any active pop-up blockers.`}
                        </div>
                    </>
                ),
                [STEPS.REDIRECTING]: () => (
                    <>
                        <p className="text-center">
                            {isPayPal
                                ? c('Info').t`You will soon be redirected to PayPal to verify your payment.`
                                : c('Info').t`You may be redirected to your bank’s website.`}
                        </p>
                        <Loader />
                        <div className="mb-4" data-testid="redirecting-message">{c('Info')
                            .t`Don’t see anything? Remember to turn off pop-up blockers.`}</div>
                    </>
                ),
                [STEPS.REDIRECTED]: () => (
                    <>
                        <p className="text-center">
                            {isAddCard && !isPayPal
                                ? c('Info').t`Please authenticate your card in the verification tab.`
                                : c('Info').t`Please authenticate your payment in the verification tab.`}
                        </p>
                        <Loader />
                        <p className="text-center">
                            <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                        </p>
                        <div className="mb-4" data-testid="redirected-message">{c('Info')
                            .t`Verification may take a few minutes.`}</div>
                    </>
                ),
                [STEPS.FAIL]: () => (
                    <div className="text-center" data-testid="fail-message">
                        <p>{!isAddCard && c('Info').t`We couldn’t process your payment.`}</p>
                        <img src={errorSvg} alt={c('Title').t`Error`} />
                        <p>
                            {isPayPal
                                ? c('Info')
                                      .t`Please try again, use a different payment method, or contact PayPal for assistance.`
                                : c('Info').t`Please try again using a different payment method, or contact your bank.`}
                        </p>
                        {error?.tryAgain ? (
                            <p>
                                <Button type="submit">{c('Action').t`Try again`}</Button>
                            </p>
                        ) : null}
                        <p>
                            <PrimaryButton onClick={handleCancel}>
                                {isAddCard
                                    ? c('Action').t`Use a different card`
                                    : c('Action').t`Use a different payment method`}
                            </PrimaryButton>
                        </p>
                    </div>
                ),
            }[step]()}
        </FormModal>
    );
};

export default PaymentVerificationModal;
