import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import xhr from 'proton-shared/lib/fetch/fetch';
import configureApi from 'proton-shared/lib/api';

import ApiContext from './apiContext';

const PublicApiProvider = ({ config, children }) => {
    const apiRef = useRef();

    if (!apiRef.current) {
        apiRef.current = configureApi({
            ...config,
            xhr
        });
    }

    return <ApiContext.Provider value={apiRef.current}>{children}</ApiContext.Provider>;
};

PublicApiProvider.propTypes = {
    children: PropTypes.node.isRequired,
    config: PropTypes.object.isRequired
};

export default PublicApiProvider;
