import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Route } from 'react-router';
import { Sidebar, AppsSidebar } from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

import PrivateHeader from './PrivateHeader';

const PrivateLayout = ({ children }) => {
    const list = [
        {
            icon: 'dashboard',
            text: c('Link').t`Dashboard`,
            link: '/dashboard'
        },
        {
            icon: 'account',
            text: c('Link').t`Account`,
            link: '/account'
        },
        {
            icon: 'download',
            text: c('Link').t`Downloads`,
            link: '/downloads'
        },
        {
            icon: 'payments',
            text: c('Link').t`Payments`,
            link: '/payments'
        }
    ];
    return (
        <div className="flex flex-nowrap no-scroll">
            <AppsSidebar currentApp={APPS.PROTONVPN_SETTINGS} />
            <div className="content flex-item-fluid reset4print">
                <PrivateHeader />
                <div className="flex flex-nowrap">
                    <Route path="/:path" render={() => <Sidebar list={list} />} />
                    <div className="main flex-item-fluid main-area">
                        <div className="flex flex-reverse">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

PrivateLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default PrivateLayout;
