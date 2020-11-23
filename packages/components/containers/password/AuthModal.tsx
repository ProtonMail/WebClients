import React, { useState } from 'react';
import { PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';
import { srpAuth } from 'proton-shared/lib/srp';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { useApi } from '../../hooks';
import AskAuthModal from './AskAuthModal';

interface Props<T> {
    onClose?: () => void;
    onError?: (error: Error) => void;
    onSuccess: (data: { password: string; totp: string; result: T }) => void;
    config: any;
}

const AuthModal = <T,>({ onClose, onError, onSuccess, config, ...rest }: Props<T>) => {
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async ({ password, totp }: { password: string; totp: string }) => {
        try {
            setLoading(true);

            const result = await srpAuth<T>({
                api,
                credentials: { password, totp },
                config,
            });

            onSuccess({ password, totp, result });
            onClose?.();
        } catch (error) {
            const { code, message } = getApiErrorMessage(error);
            if (code === PASSWORD_WRONG_ERROR) {
                setError(message);
            }
            onError?.(error);
            onClose?.();
        }
    };

    return <AskAuthModal onSubmit={handleSubmit} onClose={onClose} loading={loading} error={error} {...rest} />;
};

export default AuthModal;
