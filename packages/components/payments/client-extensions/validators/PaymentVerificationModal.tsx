import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import PaymentVerificationImage from '@proton/components/containers/payments/PaymentVerificationImage';
import { type CardPayment, PAYMENT_METHOD_TYPES } from '@proton/payments';
import errorSvg from '@proton/styles/assets/img/errors/error-generic.svg';

import Form from '../../../components/form/Form';
import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';

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
    open?: boolean;
    onSubmit: () => void;
    onClose: (reason: 'succeeded' | 'cancelled') => void;
    payment?: CardPayment;
    isAddCard?: boolean;
    type?: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.CARD;
    onProcess: () => PromiseWithController;
    initialProcess?: PromiseWithController;
    processingDelay?: number;
    onVerificationAttempted?: () => void;
    onVerificationFailed?: () => void;
    onVerificationRejectedByUser?: () => void;
}

const PaymentVerificationModal = ({
    onSubmit,
    payment,
    isAddCard,
    type = PAYMENT_METHOD_TYPES.CARD,
    onProcess,
    initialProcess,
    processingDelay = DEFAULT_PROCESSING_DELAY,
    onVerificationAttempted,
    onVerificationFailed,
    onVerificationRejectedByUser,
    ...rest
}: Props) => {
    const isPayPal = [PAYMENT_METHOD_TYPES.PAYPAL].includes(type);

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
    const abortRef = useRef<AbortController>();
    const timeoutRef = useRef<number>();

    const handleCancel = () => {
        abortRef.current?.abort();
        rest.onClose('cancelled');
    };

    const handleCancelByUser = () => {
        onVerificationRejectedByUser?.();
        handleCancel();
    };

    const handleSubmit = async ({ abort, promise }: PromiseWithController) => {
        try {
            onVerificationAttempted?.();
            setStep(STEPS.REDIRECTING);
            timeoutRef.current = window.setTimeout(() => {
                setStep(STEPS.REDIRECTED);
            }, processingDelay);
            abortRef.current = abort;
            await promise;
            onSubmit();
            rest.onClose('succeeded');
        } catch (error: any) {
            onVerificationFailed?.();
            window.clearTimeout(timeoutRef.current);
            setStep(STEPS.FAIL);
            setError(error);
        }
    };

    useEffect(() => {
        if (initialProcess) {
            void handleSubmit(initialProcess);
        }
    }, []);

    useEffect(() => {
        return () => window.clearTimeout(timeoutRef.current);
    }, []);

    return (
        <ModalTwo
            as={Form}
            size="small"
            onSubmit={() => handleSubmit(onProcess())}
            {...rest}
            onClose={() => rest.onClose('cancelled')}
        >
            <ModalTwoHeader hasClose={false} title={TITLES[step]} />
            <ModalTwoContent>
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
                            <p>
                                {isAddCard && !isPayPal
                                    ? c('Info').t`Please authenticate your card in the verification tab.`
                                    : c('Info').t`Please authenticate your payment in the verification tab.`}
                            </p>
                            <div className="mb-4" data-testid="redirected-message">
                                {c('Info').t`Verification may take a few minutes.`}
                            </div>
                            <Loader />
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
                                    : c('Info')
                                          .t`Please try again using a different payment method, or contact your bank.`}
                            </p>
                            {error?.tryAgain ? (
                                <p>
                                    <Button type="submit">{c('Action').t`Try again`}</Button>
                                </p>
                            ) : null}
                            <p className="text-center">
                                <Button color="norm" onClick={handleCancel}>
                                    {isAddCard
                                        ? c('Action').t`Use a different card`
                                        : c('Action').t`Use a different payment method`}
                                </Button>
                            </p>
                        </div>
                    ),
                }[step]()}
            </ModalTwoContent>
            <ModalTwoFooter>
                {(() => {
                    if (step === STEPS.REDIRECT) {
                        return (
                            <>
                                <Button onClick={handleCancelByUser}>{c('Action').t`Cancel`}</Button>
                                <Button color="norm" type="submit">{c('Action').t`Verify`}</Button>
                            </>
                        );
                    }
                    if (step === STEPS.REDIRECTED) {
                        return (
                            <>
                                <Button onClick={handleCancelByUser}>{c('Action').t`Cancel`}</Button>
                            </>
                        );
                    }
                    return null;
                })()}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PaymentVerificationModal;
