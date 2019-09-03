import React from 'react';
import { FullLoader, useConfig } from 'react-components';
import { c } from 'ttag';
import { APPS } from 'proton-shared/lib/constants';

import './loaderPage.scss';

const { PROTONVPN_SETTINGS } = APPS;

const LoaderPage = () => {
    const { APP_NAME } = useConfig();
    const appName = APP_NAME === PROTONVPN_SETTINGS ? 'ProtonVPN' : 'ProtonMail';
    return (
        // TODO: h100 does not seem to work.
        <div className="w100 h100" style={{ height: '100vh' }}>
            <div className="centered-absolute aligncenter">
                <FullLoader color="global-light" size={200} />
                <p className="atomLoader-text">
                    {c('Info').t`Loading`} {appName}
                </p>
            </div>
        </div>
    );
};

export default LoaderPage;
