import { ReactNode, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { c } from 'ttag';

import { StandardLoadErrorPage, useApi, useErrorHandler, useNotifications } from '@proton/components';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { checkInvitation } from '@proton/shared/lib/api/invites';
import { CLIENT_TYPES } from '@proton/shared/lib/constants';

import { InviteData } from './interfaces';

interface Props {
    onInvalid: () => void;
    onValid: ({ selector, token }: InviteData) => void;
    clientType: CLIENT_TYPES;
    loader: ReactNode;
}

const SignupInviteContainer = ({ loader, onInvalid, onValid, clientType }: Props) => {
    const { createNotification } = useNotifications();
    const { token, selector } = useParams<{ token: string; selector: string }>();
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const handleInvalid = () => {
            createNotification({ text: c('Error').t`Invalid invitation link`, type: 'error' });
            onInvalid();
        };

        if (!token || !selector) {
            return handleInvalid();
        }

        const run = async () => {
            const { Valid } = await silentApi<{ Valid: 1 | 0 }>(
                checkInvitation({
                    Selector: selector,
                    Token: token,
                    Type: clientType,
                })
            );
            if (!Valid) {
                handleInvalid();
                return;
            }
            onValid({ token, selector });
        };

        run().catch((e) => {
            errorHandler(e);
            setError({
                message: getApiErrorMessage(e),
            });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return <>{loader}</>;
};

export default SignupInviteContainer;
