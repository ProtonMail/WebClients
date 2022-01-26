import { useEffect } from 'react';
import { PrivateAuthenticationStore, PublicAuthenticationStore, useApi, useAuthentication } from '@proton/components';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { User as tsUser } from '@proton/shared/lib/interfaces';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getUser } from '@proton/shared/lib/api/user';
import { pullForkSession, setCookies, setRefreshCookies } from '@proton/shared/lib/api/auth';
import { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { getRandomString } from '@proton/shared/lib/helpers/string';
import { locales } from '@proton/shared/lib/i18n/locales';
import { getGenericErrorPayload } from '@proton/shared/lib/broadcast';

import PrivateApp from './content/PrivateApp';
import MainContainer from './content/MainContainer';
import broadcast, { MessageType } from './broadcast';

const Setup = () => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    const { UID, login } = useAuthentication() as PublicAuthenticationStore & PrivateAuthenticationStore;

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const selector = hashParams.get('selector');

    const handleLogout = () => {
        broadcast({ type: MessageType.CLOSE });
    };

    useEffect(() => {
        if (UID) {
            return;
        }

        const run = async () => {
            if (!selector) {
                broadcast({ type: MessageType.ERROR, payload: { message: 'No selector found' } });
                return;
            }
            try {
                const { UID, RefreshToken } = await silentApi<PullForkResponse>(pullForkSession(selector));
                const { AccessToken: newAccessToken, RefreshToken: newRefreshToken } =
                    await silentApi<RefreshSessionResponse>(withUIDHeaders(UID, setRefreshCookies({ RefreshToken })));
                await silentApi(
                    withAuthHeaders(
                        UID,
                        newAccessToken,
                        setCookies({
                            Persistent: false,
                            UID,
                            RefreshToken: newRefreshToken,
                            State: getRandomString(24),
                        })
                    )
                );
                const User = await silentApi<{ User: tsUser }>(withAuthHeaders(UID, newAccessToken, getUser())).then(
                    ({ User }) => User
                );

                // session valid
                login({
                    persistent: false,
                    UID,
                    User,
                });

                return;
            } catch (error: any) {
                broadcast({ type: MessageType.ERROR, payload: getGenericErrorPayload(error) });
            }
        };

        void run();
    }, [selector]);

    if (!UID) {
        return <LoaderPage />;
    }
    return (
        <PrivateApp locales={locales} onLogout={handleLogout}>
            <MainContainer />
        </PrivateApp>
    );
};

export default Setup;
