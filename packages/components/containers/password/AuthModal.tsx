import React, { useState } from 'react';
import { PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';
import { srpAuth } from 'proton-shared/lib/srp';
import { useApi } from '../../hooks';
import AskAuthModal from './AskAuthModal';

interface Props {
    onClose?: () => void;
    onError?: (error: Error) => void;
    onSuccess: (data: { password: string; totp: string; result: any }) => void;
    config: any;
}
const AuthModal = ({ onClose, onError, onSuccess, config, ...rest }: Props) => {
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async ({ password, totp }: { password: string; totp: string }) => {
        try {
            setLoading(true);

            const result = await srpAuth({
                api,
                credentials: { password, totp },
                config,
            });

            onSuccess({ password, totp, result });
            onClose?.();
        } catch (error) {
            const { data: { Code, Error } = { Code: 0, Error: '' } } = error;
            if (Code === PASSWORD_WRONG_ERROR) {
                setError(Error);
            }
            onError && onError(error);
            onClose?.();
        }
    };

    return <AskAuthModal onSubmit={handleSubmit} onClose={onClose} loading={loading} error={error} {...rest} />;
};

export default AuthModal;
