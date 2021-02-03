import React from 'react';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { PrimaryButton } from '../../../components';
import { classnames } from '../../../helpers';

import { SUBSCRIPTION_STEPS } from './constants';
import PayPalButton from '../PayPalButton';

const NewSubscriptionSubmitButton = ({ className, paypal, canPay, step, loading, method, checkResult, onClose }) => {
    if (step === SUBSCRIPTION_STEPS.CUSTOMIZATION) {
        return (
            <PrimaryButton className={className} loading={loading} type="submit">{c('Action')
                .t`Continue`}</PrimaryButton>
        );
    }

    if (!checkResult.AmountDue) {
        return (
            <PrimaryButton className={className} loading={loading} disabled={!canPay} type="submit">{c('Action')
                .t`Confirm`}</PrimaryButton>
        );
    }

    if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
        return (
            <PayPalButton
                paypal={paypal}
                className={classnames(['button--primary', className])}
                amount={checkResult.AmountDue}
            >{c('Action').t`Pay`}</PayPalButton>
        );
    }

    if ([PAYMENT_METHOD_TYPES.CASH, PAYMENT_METHOD_TYPES.BITCOIN].includes(method)) {
        return (
            <PrimaryButton className={className} loading={loading} onClick={onClose}>{c('Action')
                .t`Done`}</PrimaryButton>
        );
    }

    return (
        <PrimaryButton className={className} loading={loading} disabled={!canPay} type="submit">{c('Action')
            .t`Pay`}</PrimaryButton>
    );
};

NewSubscriptionSubmitButton.propTypes = {
    paypal: PropTypes.object,
    className: PropTypes.string,
    canPay: PropTypes.bool,
    loading: PropTypes.bool,
    method: PropTypes.string,
    checkResult: PropTypes.object,
    step: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
};

export default NewSubscriptionSubmitButton;
