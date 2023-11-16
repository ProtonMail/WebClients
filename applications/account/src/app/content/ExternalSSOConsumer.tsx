import { ReactNode, useEffect, useState } from 'react';

import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { wait } from '@proton/shared/lib/helpers/promise';

interface Props {
    loader: ReactNode;
    onLogin: (token: string) => void;
}

const ExternalSSOConsumer = ({ loader, onLogin }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);

    useEffect(() => {
        const run = async () => {
            const hashParams = new URLSearchParams(window.location.hash.slice(1));
            const token = hashParams.get('token') || '';
            const uid = hashParams.get('uid') || '';
            if (!token) {
                setError({ message: 'Missing SSO parameters' });
                return;
            }
            /**
             * With a UID means it was a SP-initiated flow, and opener means it was opened through another tab.
             * The opener window will close this tab once it receives the sso message, but if it for some reason would not
             * then we can just proceed with this flow. But the delay ensures that it has time to close this tab before
             * it proceeds.
             */
            if (uid && window.opener) {
                window.opener.postMessage({ action: 'sso', payload: { token, uid } });
                await wait(5000);
            }
            onLogin(token);
        };

        run().catch((e) => {
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

export default ExternalSSOConsumer;
