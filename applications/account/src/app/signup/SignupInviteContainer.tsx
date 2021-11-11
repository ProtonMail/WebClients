import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LoaderPage, StandardLoadErrorPage, useApi, useErrorHandler, useNotifications } from '@proton/components';
import { checkInvitation } from '@proton/shared/lib/api/invites';
import { INVITE_TYPES } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InviteData } from './interfaces';

interface Props {
    onInvalid: () => void;
    onValid: ({ selector, token }: InviteData) => void;
}

const SignupInviteContainer = ({ onInvalid, onValid }: Props) => {
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
                    Type: INVITE_TYPES.MAIL,
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

    return <LoaderPage />;
};

export default SignupInviteContainer;
