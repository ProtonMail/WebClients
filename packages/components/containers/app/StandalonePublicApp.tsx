import { useState } from 'react';

import { LoaderPage } from '@proton/components/containers';
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
    const [loaded, setLoaded] = useState(0);
    return (
        <UnAuthenticatedApiProvider onLoaded={() => setLoaded((old) => ++old)}>
            <StandardPublicApp loader={loaderPage} locales={locales}>
                {loaded ? (
                    <div className="h100 flex flex-justify-center flex-align-items-center">
                        <div className="w20e">
                            <MinimalLoginContainer onLogin={onLogin} />
                        </div>
                    </div>
                ) : (
                    loaderPage
                )}
            </StandardPublicApp>
        </UnAuthenticatedApiProvider>
    );
};

export default StandalonePublicApp;
