import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import PromiseCacheContext from './PromiseCacheContext';

const PromiseCacheProvider = ({ cache, children }) => {
    useEffect(() => {
        return () => {
            cache.reset();
        };
    }, []);

    return <PromiseCacheContext.Provider value={cache}>{children}</PromiseCacheContext.Provider>;
};

PromiseCacheProvider.propTypes = {
    children: PropTypes.node.isRequired,
    cache: PropTypes.object.isRequired
};

export default PromiseCacheProvider;
