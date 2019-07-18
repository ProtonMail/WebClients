import React from 'react';
import PropTypes from 'prop-types';

import ConfigContext from './configContext';

const Provider = ({ config, children }) => {
    return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
};

Provider.propTypes = {
    children: PropTypes.node.isRequired,
    config: PropTypes.object.isRequired
};

export default Provider;
