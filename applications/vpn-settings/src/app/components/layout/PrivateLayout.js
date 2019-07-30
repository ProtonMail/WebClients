import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Sidebar, Icons } from 'react-components';

import Header from '../header/Header';

const getSidebar = () => {
    return [
        {
            text: c('Link').t`Home`,
            link: '/'
        },
        {
            text: c('Link').t`About`,
            link: '/about'
        }
    ];
};

const PrivateLayout = ({ children }) => {
    return (
        <>
            <Header />
            <div className="flex flex-nowrap">
                <Sidebar list={getSidebar()} />
                <main className="main flex-item-fluid main-area main-area-content">{children}</main>
            </div>
            <Icons />
        </>
    );
};

PrivateLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default PrivateLayout;
