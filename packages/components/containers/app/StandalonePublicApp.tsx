import { LoaderPage } from '@proton/components/containers';
import { useApi } from '@proton/components/hooks';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { UnleashFlagProvider } from '@proton/unleash';

import UnAuthenticatedApiProvider from '../api/UnAuthenticatedApiProvider';
import MinimalLoginContainer from '../login/MinimalLoginContainer';
import StandardPublicApp from './StandardPublicApp';
import type { OnLoginCallback } from './interface';

interface Props {
    onLogin: OnLoginCallback;
    locales: TtagLocaleMap;
}

const StandalonePublicApp = ({ onLogin, locales }: Props) => {
    const loaderPage = <LoaderPage />;
    const api = useApi();
    return (
        <StandardPublicApp loader={loaderPage} locales={locales}>
            <UnAuthenticatedApiProvider loader={loaderPage}>
                <UnleashFlagProvider api={api}>
                    <div className="h-full flex justify-center items-center">
                        <div className="w-custom" style={{ '--w-custom': '20em' }}>
                            <MinimalLoginContainer onLogin={onLogin} />
                        </div>
                    </div>
                </UnleashFlagProvider>
            </UnAuthenticatedApiProvider>
        </StandardPublicApp>
    );
};

export default StandalonePublicApp;
