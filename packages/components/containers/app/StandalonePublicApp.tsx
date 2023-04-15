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
    return (
        <UnAuthenticatedApiProvider loader={<LoaderPage />}>
            <StandardPublicApp loader={<LoaderPage />} locales={locales}>
                <div className="h100 flex flex-justify-center flex-align-items-center">
                    <div className="w20e">
                        <MinimalLoginContainer onLogin={onLogin} />
                    </div>
                </div>
            </StandardPublicApp>
        </UnAuthenticatedApiProvider>
    );
};

export default StandalonePublicApp;
