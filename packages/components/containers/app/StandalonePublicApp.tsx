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
    return (
        <StandardPublicApp loader={loaderPage} locales={locales}>
            <UnAuthenticatedApiProvider loader={loaderPage}>
                <div className="h100 flex flex-justify-center flex-align-items-center">
                    <div className="w20e">
                        <MinimalLoginContainer onLogin={onLogin} />
                    </div>
                </div>
            </UnAuthenticatedApiProvider>
        </StandardPublicApp>
    );
};

export default StandalonePublicApp;
