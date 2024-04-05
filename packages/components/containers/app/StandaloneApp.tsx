import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';

import { createAuthentication } from '@proton/account/bootstrap';
import ApiProvider from '@proton/components/containers/api/ApiProvider';
import ProtonApp from '@proton/components/containers/app/ProtonApp';
import createApi from '@proton/shared/lib/api/createApi';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import '@proton/styles/scss/_proton-account.scss';

import StandalonePublicApp from './StandalonePublicApp';

const config = { APP_NAME: APPS.PROTONACCOUNT, APP_VERSION: '5.0.999.999', API_URL: '/api' } as ProtonConfig;
const api = createApi({ config });
const authentication = createAuthentication();

if (authentication.ready) {
    replaceUrl('/');
}

const Component = () => {
    return (
        <ProtonApp config={config}>
            <BrowserRouter>
                <ApiProvider api={api}>
                    <StandalonePublicApp
                        locales={{}}
                        onLogin={async (args) => {
                            replaceUrl(authentication.login(args));
                            return { state: 'complete' };
                        }}
                    />
                </ApiProvider>
            </BrowserRouter>
        </ProtonApp>
    );
};

ReactDOM.render(<Component />, document.querySelector('.app-root'));
