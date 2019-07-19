import React from 'react';
import PropTypes from 'prop-types';
import { Icons } from 'react-components';

const PublicLayout = ({ children }) => {
    return (
        <>
            <div className="flex flex-nowrap">
                <main className="main flex-item-fluid main-area">{children}</main>
            </div>
            <Icons />
        </>
    );
};

PublicLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default PublicLayout;
