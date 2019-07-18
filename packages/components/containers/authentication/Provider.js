import React from 'react';
import PropTypes from 'prop-types';

import AuthenticationContext from './authenticationContext';

const AuthenticationProvider = ({ store, children }) => {
    return <AuthenticationContext.Provider value={store}>{children}</AuthenticationContext.Provider>;
};

AuthenticationProvider.propTypes = {
    children: PropTypes.node.isRequired,
    store: PropTypes.object.isRequired
};

export default AuthenticationProvider;
