import React from 'react';
import PropTypes from 'prop-types';
import { FullLoader, TextLoader, useConfig } from 'react-components';
import { c } from 'ttag';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

const { VPN } = CLIENT_TYPES;

const LoaderPage = ({ text, loaderClassName = 'color-global-light' }) => {
    const { CLIENT_TYPE } = useConfig();
    const appName = CLIENT_TYPE === VPN ? 'ProtonVPN' : 'ProtonMail';
    return (
        <div className="centered-absolute aligncenter">
            <FullLoader className={loaderClassName} size={200} />
            <TextLoader>{text || c('Info').t`Loading ${appName}`}</TextLoader>
        </div>
    );
};

LoaderPage.propTypes = {
    text: PropTypes.string,
    loaderClassName: PropTypes.string
};

export default LoaderPage;
