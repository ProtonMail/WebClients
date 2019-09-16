import React from 'react';
import PropTypes from 'prop-types';
import { FormModal, Alert, Loader, useNotifications, useLoading, useApi, useConfig } from 'react-components';
import { c } from 'ttag';
import tabSvg from 'design-system/assets/img/pm-images/tab.svg';

import { toParams, process } from './paymentTokenHelper';

const PaymentVerificationModal = ({ params, token, approvalURL, onSubmit, ...rest }) => {
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { createNotification } = useNotifications();
    const title = loading ? c('Title').t`Payment verification in progress` : c('Title').t`Payment verification`;
    const { SECURE_URL: secureURL } = useConfig();

    const handleSubmit = async () => {
        try {
            await process({ Token: token, api, approvalURL, secureURL });
            onSubmit(toParams(params, token));
            rest.onClose();
        } catch (error) {
            rest.onClose();

            // if not coming from API error
            if (error.message && !error.config) {
                createNotification({ text: error.message, type: 'error' });
            }
        }
    };

    return (
        <FormModal
            title={title}
            submit={c('Action').t`Verify payment`}
            onSubmit={() => withLoading(handleSubmit())}
            small={true}
            {...rest}
        >
            {loading ? <Loader /> : <img src={tabSvg} alt={c('Title').t`New tab`} />}
            {loading ? (
                <Alert>{c('Info').t`Please verify the payment in the new tab.`}</Alert>
            ) : (
                <Alert>{c('Info')
                    .t`A new tab will open to confirm the payment, please disable any popup blockers.`}</Alert>
            )}
        </FormModal>
    );
};

PaymentVerificationModal.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    token: PropTypes.string.isRequired,
    approvalURL: PropTypes.string.isRequired,
    params: PropTypes.object
};

export default PaymentVerificationModal;
