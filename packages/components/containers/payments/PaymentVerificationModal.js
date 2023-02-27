import { useEffect, useRef, useState } from 'react';

import PropTypes from 'prop-types';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ADD_CARD_MODE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { doNotWindowOpen } from '@proton/shared/lib/helpers/browser';
import errorSvg from '@proton/styles/assets/img/errors/error-generic.svg';

import { DoNotWindowOpenAlertError, FormModal, Loader, PrimaryButton } from '../../components';
import { useNotifications } from '../../hooks';
import PaymentVerificationImage from './PaymentVerificationImage';
import { toParams } from './paymentTokenToParams';

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

    let failTitle;
    if (isPayPal) {
        failTitle = c('Title').t`PayPal verification failed`;
    } else if (isAddCard) {
        failTitle = c('Title').t`Verification failed`;
    } else {
        failTitle = c('Title').t`Payment failed`;
    }

    const TITLES = {
        [STEPS.DO_NOT_WINDOW_OPEN]: c('Title').t`Unsupported browser`,
        [STEPS.REDIRECT]: isAddCard ? c('Title').t`Card verification` : c('Title').t`Payment verification`,
        [STEPS.REDIRECTING]: c('Title').t`Processing...`,
        [STEPS.REDIRECTED]: isAddCard ? c('Title').t`Verifying your card...` : c('Title').t`Verifying your payment...`,
        [STEPS.FAIL]: failTitle,
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
                        <div className="mb1">
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
                        <div className="mb1">{c('Info')
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
                        <div className="mb1">{c('Info').t`Verification may take a few minutes.`}</div>
                    </>
                ),
                [STEPS.DO_NOT_WINDOW_OPEN]: () => (
                    <>
                        <DoNotWindowOpenAlertError />
                        <Button onClick={handleCancel}>{c('Action').t`Close`}</Button>
                    </>
                ),
                [STEPS.FAIL]: () => (
                    <div className="text-center">
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
