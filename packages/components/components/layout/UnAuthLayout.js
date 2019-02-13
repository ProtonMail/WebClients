import React from 'react';
import PropTypes from 'prop-types';

const UnAuthLayout = ({ children }) => {
    return (
        <>
            <div className="flex flex-nowrap">
                <main className="main flex-item-fluid main-area">{children}</main>
            </div>
        </>
    );
};

UnAuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default UnAuthLayout;
