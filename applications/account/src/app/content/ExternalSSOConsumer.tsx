import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { StandardLoadErrorPage } from '@proton/components';
import { ExternalSSOFlow } from '@proton/components/containers/login/interface';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { wait } from '@proton/shared/lib/helpers/promise';

interface Props {
    loader: ReactNode;
    onLogin: (data: { username?: string; token?: string; flow: ExternalSSOFlow }) => void;
}

const ExternalSSOConsumer = ({ loader, onLogin }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);

    useEffect(() => {
        const run = async () => {
            const hashParams = new URLSearchParams(window.location.hash.slice(1));
            const searchParams = new URLSearchParams(window.location.search);
            const token = hashParams.get('token') || '';
            const uid = hashParams.get('uid') || '';
            const username = hashParams.get('username') || searchParams.get('username') || '';
            let flow = searchParams.get('flow') === 'redirect' ? ExternalSSOFlow.Redirect : ExternalSSOFlow.Idp;
            /**
             * With a UID means it was a SP-initiated flow, and opener means it was opened through another tab.
             * The opener window will close this tab once it receives the sso message, but if it for some reason would not
             * then we can just proceed with this flow. But the delay ensures that it has time to close this tab before
             * it proceeds.
             */
            if (uid && token && window.opener) {
                flow = ExternalSSOFlow.Sp;
                window.opener.postMessage({ action: 'sso', payload: { token, uid } });
                await wait(5000);
            }
            onLogin({ username, token, flow });
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
