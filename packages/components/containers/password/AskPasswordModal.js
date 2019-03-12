import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { InputModal } from 'react-components';

const AskPasswordModal = ({ onClose, onSubmit }) => {
    return (
        <InputModal
            label={c('Label').t`Password`}
            title={c('Title').t`Sign in again to continue`}
            show={true}
            cancel={c('Label').t`Cancel`}
            confirm={c('Label').t`Submit`}
            placeholder={c('Placeholder').t`Password`}
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
