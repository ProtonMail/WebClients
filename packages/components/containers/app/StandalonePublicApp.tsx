import type { ReactNode } from 'react';

import LoaderPage from '@proton/components/containers/app/LoaderPage';
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

const UnleashFlagProviderWrapper = ({ children }: { children: ReactNode }) => {
    const api = useApi();
    return <UnleashFlagProvider api={api}>{children}</UnleashFlagProvider>;
};

const StandalonePublicApp = ({ onLogin, locales }: Props) => {
    const loaderPage = <LoaderPage />;
    return (
        <StandardPublicApp loader={loaderPage} locales={locales}>
            <UnAuthenticatedApiProvider loader={loaderPage}>
                <UnleashFlagProviderWrapper>
                    <div className="h-full flex justify-center items-center">
                        <div className="w-custom" style={{ '--w-custom': '20em' }}>
                            <MinimalLoginContainer onLogin={onLogin} />
                        </div>
                    </div>
                </UnleashFlagProviderWrapper>
            </UnAuthenticatedApiProvider>
        </StandardPublicApp>
    );
};

export default StandalonePublicApp;
