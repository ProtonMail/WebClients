import React from 'react';
import PropTypes from 'prop-types';
import { PublicTopBanners } from 'react-components';

const PublicLayout = ({ children }) => {
    return (
        <main className="main-full flex-noMinChildren flex-column flex-nowrap reset4print">
            <PublicTopBanners />
            {children}
        </main>
    );
};

PublicLayout.propTypes = {
    children: PropTypes.node.isRequired,
};

export default PublicLayout;
