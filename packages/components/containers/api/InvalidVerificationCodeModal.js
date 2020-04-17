import React from 'react';
import PropTypes from 'prop-types';
import { ConfirmModal, Button, PrimaryButton, Alert } from 'react-components';
import { c } from 'ttag';

const InvalidVerificationCodeModal = ({ onEdit, onResend, ...rest }) => {
    return (
        <ConfirmModal
            title={c('Title').t`Invalid verification code`}
            footer={
                <>
                    <Button
                        className="mr1"
                        onClick={() => {
                            rest.onClose();
                            onEdit();
                        }}
                    >{c('Action').t`Try other method`}</Button>
                    <PrimaryButton
                        onClick={() => {
                            rest.onClose();
                            onResend();
                        }}
                    >{c('Action').t`Request new code`}</PrimaryButton>
                </>
            }
            {...rest}
        >
            <Alert type="error">
                {c('Info')
                    .t`Would you like to receive a new verification code or use an alternative verification method?`}
            </Alert>
        </ConfirmModal>
    );
};

InvalidVerificationCodeModal.propTypes = {
    onEdit: PropTypes.func.isRequired,
    onResend: PropTypes.func.isRequired
};

export default InvalidVerificationCodeModal;
