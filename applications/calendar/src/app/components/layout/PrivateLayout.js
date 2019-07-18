import React from 'react';
import PropTypes from 'prop-types';

import PrivateHeader from './PrivateHeader';

const PrivateLayout = ({ children }) => {
    return (
        <>
            <PrivateHeader />
            <div className="flex flex-nowrap">{children}</div>
        </>
    );
};

PrivateLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default PrivateLayout;
