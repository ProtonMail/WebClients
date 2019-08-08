import React from 'react';
import PropTypes from 'prop-types';
import { useApiResult } from 'react-components';
import { getClientVPNInfo } from 'proton-shared/lib/api/vpn';

import UserVPNContext from './userVPNContext';

const UserVPNProvider = ({ children }) => {
    const value = useApiResult(getClientVPNInfo, []);

    return <UserVPNContext.Provider value={value}>{children}</UserVPNContext.Provider>;
};

UserVPNProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default UserVPNProvider;
