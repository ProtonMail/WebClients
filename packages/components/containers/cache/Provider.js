import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import CacheContext from './cacheContext';

const Provider = ({ cache, children }) => {
    useEffect(() => {
        return () => {
            cache.reset();
        };
    }, []);

    return <CacheContext.Provider value={cache}>{children}</CacheContext.Provider>;
};

Provider.propTypes = {
    children: PropTypes.node.isRequired,
    cache: PropTypes.object.isRequired
};

export default Provider;
