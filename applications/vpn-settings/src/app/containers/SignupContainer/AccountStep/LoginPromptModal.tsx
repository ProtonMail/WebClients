import React from 'react';
import { c } from 'ttag';
import { useHistory } from 'react-router-dom';
import { ConfirmModal, Alert } from '@proton/components';

interface Props {
    email: string;
}

const LoginPromptModal = ({ email, ...rest }: Props) => {
    const history = useHistory();
    const handleConfirm = () => history.push('/login');
    return (
        <ConfirmModal
            title={c('Title').t`You already have a Proton account`}
            confirm={c('Action').t`Go to login`}
            onConfirm={handleConfirm}
            {...rest}
        >
            <Alert type="warning">
                {c('Info')
                    .t`Your existing Proton account can be used to access all Proton services. Please login with ${email}`}
            </Alert>
        </ConfirmModal>
    );
};

export default LoginPromptModal;
