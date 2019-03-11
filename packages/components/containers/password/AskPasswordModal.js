import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';
import { InputModal } from 'react-components';

const AskPasswordModal = ({ onClose, onSubmit }) => {
    return (
        <InputModal
            label={t`Password`}
            title={t`Sign in again to continue`}
            show={true}
            cancel={t`Cancel`}
            confirm={t`Submit`}
            onSubmit={onSubmit}
            onClose={onClose}
        />
    );
};

AskPasswordModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};
export default AskPasswordModal;
