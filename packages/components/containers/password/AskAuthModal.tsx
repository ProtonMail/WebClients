import { c } from 'ttag';
import { useState } from 'react';

import { FormModal, Loader } from '../../components';
import PasswordTotpInputs from './PasswordTotpInputs';
import useAskAuth from './useAskAuth';

interface Props {
    onClose?: () => void;
    onSubmit: (data: { password: string; totp: string }) => void;
    error: string;
    loading?: boolean;

    [key: string]: any;
}

const AskAuthModal = ({ onClose, onSubmit, error, loading, ...rest }: Props) => {
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

    return (
        <FormModal
            onClose={onClose}
            onSubmit={() => onSubmit({ password, totp })}
            title={c('Title').t`Sign in again to continue`}
            close={c('Label').t`Cancel`}
            submit={c('Label').t`Submit`}
            error={error}
            small
            loading={loading || isLoadingAuth}
            {...rest}
        >
            {isLoadingAuth ? (
                <Loader />
            ) : (
                <PasswordTotpInputs
                    password={password}
                    setPassword={setPassword}
                    passwordError={error}
                    totp={totp}
                    setTotp={setTotp}
                    totpError={error}
                    showTotp={hasTOTPEnabled}
                />
            )}
        </FormModal>
    );
};

export default AskAuthModal;
