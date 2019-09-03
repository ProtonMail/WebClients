import React from 'react';
import PropTypes from 'prop-types';
import { FormModal, Alert, useApi, useLoading, Loader, useNotifications } from 'react-components';
import { c } from 'ttag';
import tabSvg from 'design-system/assets/img/pm-images/tab.svg';

import { process, toParams } from './paymentTokenHelper';

const PaymentVerificationModal = ({ params, token, url, onSubmit, ...rest }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const title = loading ? c('Title').t`Payment verification in progress` : c('Title').t`Payment verification`;

    const handleSubmit = async () => {
        const tab = window.open(url);

        try {
            await process({ Token: token, api, tab });
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
    url: PropTypes.string.isRequired,
    params: PropTypes.object
};

export default PaymentVerificationModal;
