import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import CacheContext from './CacheContext';

const CacheProvider = ({ cache, children }) => {
    useEffect(() => {
        return () => {
            cache.reset();
        };
    }, []);

    return <CacheContext.Provider value={cache}>{children}</CacheContext.Provider>;
};

CacheProvider.propTypes = {
    children: PropTypes.node.isRequired,
    cache: PropTypes.object.isRequired
};

export default CacheProvider;
