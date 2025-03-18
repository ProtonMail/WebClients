import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { createAuthentication, createUnleash } from '@proton/account/bootstrap';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import UnauthenticatedApiProvider from '@proton/components/containers/api/UnauthenticatedApiProvider';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import StandardPublicApp from '@proton/components/containers/app/StandardPublicApp';
import MinimalLoginContainer from '@proton/components/containers/login/MinimalLoginContainer';
import createApi from '@proton/shared/lib/api/createApi';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { FlagProvider } from '@proton/unleash';
import noop from '@proton/utils/noop';

import '@proton/styles/scss/_proton-account.scss';

const config = { APP_NAME: APPS.PROTONACCOUNT, APP_VERSION: '5.0.999.999', API_URL: '/api' } as ProtonConfig;
const api = createApi({ config });
const authentication = createAuthentication();
const unauthenticatedApi = createUnauthenticatedApi(api);
const unleashClient = createUnleash({ api: unauthenticatedApi.apiCallback });

unleashClient.start().catch(noop);

if (authentication.ready) {
    replaceUrl('/');
}

const locales = {};

const Component = () => {
    const loaderPage = <LoaderPage />;
    return (
        <ProtonApp config={config}>
            <BrowserRouter>
                <ApiProvider api={api}>
                    <StandardPublicApp loader={loaderPage} locales={locales}>
                        <UnauthenticatedApiProvider unauthenticatedApi={unauthenticatedApi}>
                            <FlagProvider unleashClient={unleashClient} startClient={false}>
                                <div className="h-full flex justify-center items-center">
                                    <div className="w-custom" style={{ '--w-custom': '20em' }}>
                                        <MinimalLoginContainer
                                            onStartAuth={() => unauthenticatedApi.startUnAuthFlow()}
                                            onLogin={async (args) => {
                                                replaceUrl(authentication.login(args.data));
                                                return { state: 'complete' };
                                            }}
                                        />
                                    </div>
                                </div>
                            </FlagProvider>
                        </UnauthenticatedApiProvider>
                    </StandardPublicApp>
                </ApiProvider>
            </BrowserRouter>
        </ProtonApp>
    );
};

ReactDOM.render(<Component />, document.querySelector('.app-root'));
