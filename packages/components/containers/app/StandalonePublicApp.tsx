import { LoaderPage, UnleashFlagProvider } from '@proton/components/containers';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import UnAuthenticatedApiProvider from '../api/UnAuthenticatedApiProvider';
import MinimalLoginContainer from '../login/MinimalLoginContainer';
import StandardPublicApp from './StandardPublicApp';
import { OnLoginCallback } from './interface';

interface Props {
    onLogin: OnLoginCallback;
    locales: TtagLocaleMap;
}

const StandalonePublicApp = ({ onLogin, locales }: Props) => {
    const loaderPage = <LoaderPage />;
    return (
        <StandardPublicApp loader={loaderPage} locales={locales}>
            <UnAuthenticatedApiProvider loader={loaderPage}>
                <UnleashFlagProvider>
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
