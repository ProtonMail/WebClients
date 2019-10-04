import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    FormModal,
    Alert,
    Loader,
    Button,
    ResetButton,
    useNotifications,
    useApi,
    PrimaryButton
} from 'react-components';
import { c } from 'ttag';
import errorSvg from 'design-system/assets/img/pm-images/error.svg';
import { ADD_CARD_MODE } from 'proton-shared/lib/constants';

import { toParams, process } from './paymentTokenHelper';
import PaymentVerificationImage from './PaymentVerificationImage';

const STEPS = {
    REDIRECT: 'redirect',
    REDIRECTING: 'redirecting',
    REDIRECTED: 'redirected',
    FAIL: 'fail'
};

const PROCESSING_DELAY = 5000;

const PaymentVerificationModal = ({
    params,
    token,
    approvalURL,
    returnHost,
    onSubmit,
    payment = {},
    mode,
    ...rest
}) => {
    const isAddCard = mode === ADD_CARD_MODE;
    const TITLES = {
        [STEPS.REDIRECT]: isAddCard ? c('Title').t`Card verification` : c('Title').t`Payment verification`,
        [STEPS.REDIRECTING]: c('Title').t`Processing...`,
        [STEPS.REDIRECTED]: isAddCard
            ? c('Title').t`Card verification in progress`
            : c('Title').t`Payment verification in progress`,
        [STEPS.FAIL]: c('Title').t`3-D Secure verification failed`
    };
    const [step, setStep] = useState(STEPS.REDIRECT);
    const [error, setError] = useState({});
    const api = useApi();
    const { createNotification } = useNotifications();
    const abortRef = useRef();

    const handleCancel = () => {
        abortRef.current && abortRef.current.abort();
        rest.onClose();
    };

    const handleSubmit = async () => {
        let timeoutID;
        try {
            setStep(STEPS.REDIRECTING);
            timeoutID = setTimeout(() => {
                setStep(STEPS.REDIRECTED);
            }, PROCESSING_DELAY);
            abortRef.current = new AbortController();
            await process({
                Token: token,
                api,
                ReturnHost: returnHost,
                ApprovalURL: approvalURL,
                signal: abortRef.current.signal
            });
            onSubmit(toParams(params, token));
            rest.onClose();
        } catch (error) {
            clearTimeout(timeoutID);
            setStep(STEPS.FAIL);
            // if not coming from API error
            if (error.message && !error.config) {
                setError(error);
                createNotification({ text: error.message, type: 'error' });
            }
        }
    };

    return (
        <FormModal
            title={TITLES[step]}
            onSubmit={handleSubmit}
            onClose={handleCancel}
            small={true}
            hasClose={false}
            footer={
                step === STEPS.REDIRECT ? (
                    <>
                        <ResetButton>{c('Action').t`Cancel`}</ResetButton>
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
                            <p className="aligncenter">{c('Info')
                                .t`Your bank requires 3-D Secure verification for security purposes.`}</p>
                            <p className="aligncenter">
                                <PaymentVerificationImage payment={payment} />
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
                            <p className="aligncenter">{c('Info')
                                .t`You will be soon redirected to your bank to verify your payment.`}</p>
                            <Loader />
                            <Alert>{c('Info')
                                .t`Verification will open a new tab, please disable any popup blockers.`}</Alert>
                        </>
                    ),
                    [STEPS.REDIRECTED]: (
                        <>
                            <p className="aligncenter">
                                {isAddCard
                                    ? c('Info').t`Please verify the card in the new tab which was opened.`
                                    : c('Info').t`Please verify payment at the new tab which was opened.`}
                            </p>
                            <Loader />
                            <p className="aligncenter">
                                <Button onClick={handleCancel}>{c('Action').t`Cancel`}</Button>
                            </p>
                            <Alert>
                                {isAddCard
                                    ? c('Info').t`Verification can take a few minutes.`
                                    : c('Info').t`Payment can take a few minutes to fully verify.`}
                            </Alert>
                        </>
                    ),
                    [STEPS.FAIL]: (
                        <div className="aligncenter">
                            <p>{c('Info')
                                .t`Please try again, use a different payment method, or call your bank for assistance.`}</p>
                            <img src={errorSvg} alt={c('Title').t`Error`} />
                            {error.tryAgain ? (
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
                    )
                }[step]
            }
        </FormModal>
    );
};

PaymentVerificationModal.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    approvalURL: PropTypes.string.isRequired,
    returnHost: PropTypes.string.isRequired,
    params: PropTypes.object,
    payment: PropTypes.object,
    mode: PropTypes.string
};

export default PaymentVerificationModal;
