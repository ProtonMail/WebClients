import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import errorSvg from '@proton/styles/assets/img/errors/generic-error.svg';
import { ADD_CARD_MODE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';

import { useNotifications } from '../../hooks';
import { FormModal, Alert, Loader, Button, PrimaryButton, DoNotWindowOpenAlertError } from '../../components';

import { toParams } from './paymentTokenToParams';
import PaymentVerificationImage from './PaymentVerificationImage';

const STEPS = {
    DO_NOT_WINDOW_OPEN: 'do_not_window_open',
    REDIRECT: 'redirect',
    REDIRECTING: 'redirecting',
    REDIRECTED: 'redirected',
    FAIL: 'fail',
};

const PROCESSING_DELAY = 5000;

/** @type any */
const PaymentVerificationModal = ({
    params,
    token,
    onSubmit,
    payment = {},
    mode,
    type = PAYMENT_METHOD_TYPES.CARD,
    onProcess,
    initialProcess,
    ...rest
}) => {
    const isAddCard = mode === ADD_CARD_MODE;
    const isPayPal = [PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.PAYPAL_CREDIT].includes(type);
    const TITLES = {
        [STEPS.DO_NOT_WINDOW_OPEN]: c('Title').t`Unsupported browser`,
        [STEPS.REDIRECT]: isAddCard ? c('Title').t`Card verification` : c('Title').t`Payment verification`,
        [STEPS.REDIRECTING]: c('Title').t`Processing...`,
        [STEPS.REDIRECTED]: isAddCard
            ? c('Title').t`Card verification in progress`
            : c('Title').t`Payment verification in progress`,
        [STEPS.FAIL]: isPayPal
            ? c('Title').t`PayPal verification failed`
            : c('Title').t`3-D Secure verification failed`,
    };
    const [step, setStep] = useState(() => (doNotWindowOpen() ? STEPS.DO_NOT_WINDOW_OPEN : STEPS.REDIRECT));
    const [error, setError] = useState({});
    const { createNotification } = useNotifications();
    const abortRef = useRef();
    const timeoutRef = useRef();

    const handleCancel = () => {
        abortRef.current?.abort();
        rest.onClose();
    };

    const handleSubmit = async ({ abort, promise }) => {
        try {
            setStep(STEPS.REDIRECTING);
            timeoutRef.current = window.setTimeout(() => {
                setStep(STEPS.REDIRECTED);
            }, PROCESSING_DELAY);
            abortRef.current = abort;
            await promise;
            onSubmit(toParams(params, token, type));
            rest.onClose();
        } catch (error) {
            window.clearTimeout(timeoutRef.current);
            setStep(STEPS.FAIL);
            setError(error);
            // if not coming from API error
            if (error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
        }
    };

    useEffect(() => {
        if (initialProcess) {
            handleSubmit(initialProcess);
        }
    }, []);

    return (
        <FormModal
            title={TITLES[step]}
            onSubmit={() => handleSubmit(onProcess())}
            onClose={handleCancel}
            small
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
            {
                {
                    [STEPS.REDIRECT]: (
                        <>
                            <p className="text-center">{c('Info')
                                .t`Your bank requires 3-D Secure verification for security purposes.`}</p>
                            <p className="text-center">
                                <PaymentVerificationImage payment={payment} type={type} />
                            </p>
                            <Alert>
                                {isAddCard
                                    ? c('Info')
                                          .t`Verification will open a new tab, please disable any popup blockers. You will not be charged. Any amount used to verify the card will be refunded immediately.`
                                    : c('Info').t`Verification will open a new tab, please disable any popup blockers.`}
                            </Alert>
                        </>
                    ),
                    [STEPS.REDIRECTING]: (
                        <>
                            <p className="text-center">
                                {isPayPal
                                    ? c('Info').t`You will soon be redirected to PayPal to verify your payment.`
                                    : c('Info').t`You will be soon redirected to your bank to verify your payment.`}
                            </p>
                            <Loader />
                            <Alert>{c('Info')
                                .t`Verification will open a new tab, please disable any popup blockers.`}</Alert>
                        </>
                    ),
                    [STEPS.REDIRECTED]: (
                        <>
                            <p className="text-center">
                                {isAddCard && !isPayPal
                                    ? c('Info').t`Please verify the card in the new tab which was opened.`
                                    : c('Info').t`Please verify payment at the new tab which was opened.`}
                            </p>
                            <Loader />
                            <p className="text-center">
                                <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                            </p>
                            <Alert>
                                {isAddCard && isPayPal
                                    ? c('Info').t`Verification can take a few minutes.`
                                    : c('Info').t`Payment can take a few minutes to fully verify.`}
                            </Alert>
                        </>
                    ),
                    [STEPS.DO_NOT_WINDOW_OPEN]: (
                        <>
                            <DoNotWindowOpenAlertError />
                            <Button onClick={handleCancel}>{c('Action').t`Close`}</Button>
                        </>
                    ),
                    [STEPS.FAIL]: (
                        <div className="text-center">
                            <p>
                                {isPayPal
                                    ? c('Info')
                                          .t`Please try again, use a different payment method, or contact PayPal for assistance.`
                                    : c('Info')
                                          .t`Please try again, use a different payment method, or call your bank for assistance.`}
                            </p>
                            <img src={errorSvg} alt={c('Title').t`Error`} />
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
                }[step]
            }
        </FormModal>
    );
};

PaymentVerificationModal.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    params: PropTypes.object,
    payment: PropTypes.object,
    mode: PropTypes.string,
    type: PropTypes.string,
    onProcess: PropTypes.func.isRequired,
    initialProcess: PropTypes.object,
};

export default PaymentVerificationModal;
