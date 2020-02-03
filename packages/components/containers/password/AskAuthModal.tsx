import React, { useState } from 'react';
import { c } from 'ttag';
import { FormModal, PasswordTotpInputs, useUserSettings } from '../../index';

interface Props {
    onClose?: () => void;
    onSubmit: (data: { password: string; totp: string }) => void;
    error: string;
    hideTotp?: boolean;
    [key: string]: any;
}
const AskAuthModal = ({ onClose, onSubmit, error, hideTotp, ...rest }: Props) => {
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [{ '2FA': { Enabled } } = { '2FA': { Enabled: 0 } }] = useUserSettings();

    const showTotp = !hideTotp && !!Enabled;

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => onSubmit({ password, totp })}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            error={error}
            small
            {...rest}
        >
            <PasswordTotpInputs
                password={password}
                setPassword={setPassword}
                passwordError={error}
                totp={totp}
                setTotp={setTotp}
                totpError={error}
                showTotp={showTotp}
            />
        </FormModal>
    );
};

export default AskAuthModal;
